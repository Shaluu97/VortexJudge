#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/resource.h>
#include <sys/time.h>
#include <signal.h>
#include <stdbool.h>

/*
Linux Sandbox Runner for Online Judge
Uses setrlimit (RLIMIT_AS / RLIMIT_DATA) and wait4 rusage for precise peak memory tracking.

Usage:
  sandbox_runner_linux <timeout_ms> <mem_limit_mb> <input_file> <output_file> <error_file> <meta_file> <cmd...>
*/

static pid_t child_pid = 0;
static volatile sig_atomic_t timed_out = 0;

void alarm_handler(int sig) {
    (void)sig;
    timed_out = 1;
    if (child_pid > 0) {
        kill(-child_pid, SIGKILL);
        kill(child_pid, SIGKILL);
    }
}

int main(int argc, char* argv[]) {
    if (argc < 7) {
        fprintf(stderr, "Usage: %s <timeout_ms> <mem_limit_mb> <input_file> <output_file> <error_file> <meta_file> <cmd...>\n", argv[0]);
        return 1;
    }

    int timeout_ms = atoi(argv[1]);
    int mem_limit_mb = atoi(argv[2]);
    const char* input_file = argv[3];
    const char* output_file = argv[4];
    const char* error_file = argv[5];
    const char* meta_file = argv[6];

    char** child_args = &argv[7];

    struct timeval start_time, end_time;
    gettimeofday(&start_time, NULL);

    child_pid = fork();
    if (child_pid < 0) {
        perror("fork");
        return 1;
    }

    if (child_pid == 0) {
        // Child process
        setpgid(0, 0); // Create own process group

        // Apply Memory Limits via setrlimit (Address Space)
        if (mem_limit_mb > 0) {
            unsigned long long mem_limit_bytes = (unsigned long long)mem_limit_mb * 1024ULL * 1024ULL;
            struct rlimit rl;
            rl.rlim_cur = mem_limit_bytes;
            rl.rlim_max = mem_limit_bytes;
            setrlimit(RLIMIT_AS, &rl);
            setrlimit(RLIMIT_DATA, &rl);
        }

        // Redirect input
        if (strcmp(input_file, "-") != 0 && strlen(input_file) > 0) {
            int in_fd = open(input_file, O_RDONLY);
            if (in_fd >= 0) {
                dup2(in_fd, STDIN_FILENO);
                close(in_fd);
            }
        }

        // Redirect stdout
        int out_fd = open(output_file, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (out_fd >= 0) {
            dup2(out_fd, STDOUT_FILENO);
            close(out_fd);
        }

        // Redirect stderr
        int err_fd = open(error_file, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (err_fd >= 0) {
            dup2(err_fd, STDERR_FILENO);
            close(err_fd);
        }

        execvp(child_args[0], child_args);
        perror("execvp");
        _exit(127);
    }

    // Parent process: setup timeout
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = alarm_handler;
    sigaction(SIGALRM, &sa, NULL);

    struct itimerval timer;
    timer.it_value.tv_sec = timeout_ms / 1000;
    timer.it_value.tv_usec = (timeout_ms % 1000) * 1000;
    timer.it_interval.tv_sec = 0;
    timer.it_interval.tv_usec = 0;
    setitimer(ITIMER_REAL, &timer, NULL);

    int status = 0;
    struct rusage usage;
    wait4(child_pid, &status, 0, &usage);

    // Cancel timer
    timer.it_value.tv_sec = 0;
    timer.it_value.tv_usec = 0;
    setitimer(ITIMER_REAL, &timer, NULL);

    gettimeofday(&end_time, NULL);
    long long elapsed_ms = (end_time.tv_sec - start_time.tv_sec) * 1000LL + 
                           (end_time.tv_usec - start_time.tv_usec) / 1000LL;

    int exit_code = 0;
    if (WIFEXITED(status)) {
        exit_code = WEXITSTATUS(status);
    } else if (WIFSIGNALED(status)) {
        exit_code = 128 + WTERMSIG(status);
    }

    // ru_maxrss is in Kilobytes on Linux
    long peak_mem_kb = usage.ru_maxrss;
    long mem_limit_kb = mem_limit_mb * 1024L;

    bool is_mle = false;
    if (mem_limit_mb > 0) {
        if (peak_mem_kb >= mem_limit_kb) {
            is_mle = true;
        }
        // Linux OOM killer sends SIGKILL (exit code 137 = 128 + 9)
        if (exit_code == 137 && !timed_out) {
            is_mle = true;
        }
    }

    FILE* meta = fopen(meta_file, "w");
    if (meta) {
        fprintf(meta, "{\n");
        fprintf(meta, "  \"time_ms\": %lld,\n", elapsed_ms);
        fprintf(meta, "  \"memory_kb\": %ld,\n", peak_mem_kb);
        fprintf(meta, "  \"exit_code\": %d,\n", exit_code);
        fprintf(meta, "  \"timed_out\": %s,\n", timed_out ? "true" : "false");
        fprintf(meta, "  \"mle\": %s\n", is_mle ? "true" : "false");
        fprintf(meta, "}\n");
        fclose(meta);
    }

    return 0;
}
