#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <psapi.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <chrono>

// Escape string for JSON
std::string jsonEscape(const std::string& s) {
    std::string res;
    for (char c : s) {
        if (c == '"') res += "\\\"";
        else if (c == '\\') res += "\\\\";
        else if (c == '\b') res += "\\b";
        else if (c == '\f') res += "\\f";
        else if (c == '\n') res += "\\n";
        else if (c == '\r') res += "\\r";
        else if (c == '\t') res += "\\t";
        else res += c;
    }
    return res;
}

int main(int argc, char* argv[]) {
    // Usage: sandbox_runner.exe <timeout_ms> <mem_limit_mb> <input_file> <output_file> <error_file> <meta_file> <command...>
    if (argc < 7) {
        std::cerr << "Usage: sandbox_runner <timeout_ms> <mem_limit_mb> <input_file> <output_file> <error_file> <meta_file> <command...>" << std::endl;
        return 1;
    }

    int timeoutMs = std::stoi(argv[1]);
    int memLimitMb = std::stoi(argv[2]);
    std::string inputFile = argv[3];
    std::string outputFile = argv[4];
    std::string errorFile = argv[5];
    std::string metaFile = argv[6];

    std::string commandLine = "";
    for (int i = 7; i < argc; i++) {
        std::string arg = argv[i];
        if (arg.find(' ') != std::string::npos && arg.front() != '"') {
            arg = "\"" + arg + "\"";
        }
        if (!commandLine.empty()) commandLine += " ";
        commandLine += arg;
    }

    SECURITY_ATTRIBUTES sa;
    sa.nLength = sizeof(sa);
    sa.lpSecurityDescriptor = NULL;
    sa.bInheritHandle = TRUE;

    HANDLE hIn = NULL;
    if (inputFile != "-" && !inputFile.empty()) {
        hIn = CreateFileA(inputFile.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, &sa, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hIn == INVALID_HANDLE_VALUE) {
            std::cerr << "Failed to open input file: " << inputFile << std::endl;
            hIn = NULL;
        }
    }

    HANDLE hOut = CreateFileA(outputFile.c_str(), GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, &sa, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hOut == INVALID_HANDLE_VALUE) {
        std::cerr << "Failed to create output file: " << outputFile << std::endl;
        return 1;
    }

    HANDLE hErr = CreateFileA(errorFile.c_str(), GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, &sa, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hErr == INVALID_HANDLE_VALUE) {
        std::cerr << "Failed to create error file: " << errorFile << std::endl;
        CloseHandle(hOut);
        return 1;
    }

    HANDLE hJob = CreateJobObject(NULL, NULL);
    if (!hJob) {
        std::cerr << "CreateJobObject failed: " << GetLastError() << std::endl;
        return 1;
    }

    SIZE_T memLimitBytes = (SIZE_T)memLimitMb * 1024 * 1024;
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli = { 0 };
    jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_DIE_ON_UNHANDLED_EXCEPTION;
    if (memLimitMb > 0) {
        // Enforce hard memory limit on job
        jeli.BasicLimitInformation.LimitFlags |= JOB_OBJECT_LIMIT_JOB_MEMORY;
        jeli.JobMemoryLimit = memLimitBytes;
    }

    if (!SetInformationJobObject(hJob, JobObjectExtendedLimitInformation, &jeli, sizeof(jeli))) {
        std::cerr << "SetInformationJobObject failed: " << GetLastError() << std::endl;
    }

    STARTUPINFOA si = { 0 };
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESTDHANDLES;
    si.hStdInput = (hIn != NULL) ? hIn : GetStdHandle(STD_INPUT_HANDLE);
    si.hStdOutput = hOut;
    si.hStdError = hErr;

    PROCESS_INFORMATION pi = { 0 };

    auto startTime = std::chrono::high_resolution_clock::now();

    std::vector<char> cmdBuf(commandLine.begin(), commandLine.end());
    cmdBuf.push_back('\0');

    BOOL created = CreateProcessA(
        NULL,
        cmdBuf.data(),
        NULL,
        NULL,
        TRUE, // inherit handles
        CREATE_SUSPENDED,
        NULL,
        NULL,
        &si,
        &pi
    );

    // Close parent handles to files so child has exclusive write/read ownership
    if (hIn && hIn != INVALID_HANDLE_VALUE) CloseHandle(hIn);
    CloseHandle(hOut);
    CloseHandle(hErr);

    if (!created) {
        std::cerr << "CreateProcess failed: " << GetLastError() << std::endl;
        CloseHandle(hJob);
        std::ofstream meta(metaFile);
        meta << "{\n"
             << "  \"time_ms\": 0,\n"
             << "  \"memory_kb\": 0,\n"
             << "  \"exit_code\": -1,\n"
             << "  \"timed_out\": false,\n"
             << "  \"mle\": false,\n"
             << "  \"error\": \"CreateProcess failed\"\n"
             << "}\n";
        return 1;
    }

    AssignProcessToJobObject(hJob, pi.hProcess);
    ResumeThread(pi.hThread);

    DWORD waitRes = WaitForSingleObject(pi.hProcess, timeoutMs);
    bool timedOut = (waitRes == WAIT_TIMEOUT);

    if (timedOut) {
        // Kill all processes in job
        TerminateJobObject(hJob, 124);
        TerminateProcess(pi.hProcess, 124);
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    long long elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

    DWORD exitCode = 0;
    GetExitCodeProcess(pi.hProcess, &exitCode);

    // Memory query
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION info = { 0 };
    DWORD retLen = 0;
    QueryInformationJobObject(hJob, JobObjectExtendedLimitInformation, &info, sizeof(info), &retLen);
    SIZE_T peakMemBytes = info.PeakJobMemoryUsed;

    PROCESS_MEMORY_COUNTERS_EX pmc = { 0 };
    if (GetProcessMemoryInfo(pi.hProcess, (PROCESS_MEMORY_COUNTERS*)&pmc, sizeof(pmc))) {
        if (pmc.PeakPagefileUsage > peakMemBytes) peakMemBytes = pmc.PeakPagefileUsage;
        if (pmc.PeakWorkingSetSize > peakMemBytes) peakMemBytes = pmc.PeakWorkingSetSize;
    }

    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    CloseHandle(hJob);

    size_t peakMemKb = peakMemBytes / 1024;
    bool isMle = false;

    // Check if peak memory exceeded problem limit
    if (memLimitMb > 0 && peakMemBytes >= memLimitBytes) {
        isMle = true;
    }

    // Windows crash codes on OOM / unhandled bad_alloc:
    // 0xC0000409 = STATUS_STACK_BUFFER_OVERRUN / FAST_FAIL
    // 0xC0000017 = STATUS_NO_MEMORY (3221225495)
    // 0xC0000005 = STATUS_ACCESS_VIOLATION (often triggered after failed alloc)
    // 3 = abort() called by std::bad_alloc
    // 3221226505 = 0xC0000409
    // If exit code matches OOM crash and memory was within 90% of limit or peak reached limit:
    if (!timedOut && memLimitMb > 0) {
        if (exitCode == 3221225495 || exitCode == 0xC0000017) {
            isMle = true;
        } else if ((exitCode == 3 || exitCode == 3221226505 || exitCode == 0xC0000409 || exitCode == 1) && peakMemBytes >= (memLimitBytes * 85 / 100)) {
            // Memory was near or at the boundary when it crashed with bad_alloc / abort / error
            isMle = true;
        }
    }

    std::ofstream meta(metaFile);
    meta << "{\n"
         << "  \"time_ms\": " << elapsedMs << ",\n"
         << "  \"memory_kb\": " << peakMemKb << ",\n"
         << "  \"exit_code\": " << exitCode << ",\n"
         << "  \"timed_out\": " << (timedOut ? "true" : "false") << ",\n"
         << "  \"mle\": " << (isMle ? "true" : "false") << "\n"
         << "}\n";

    return 0;
}
