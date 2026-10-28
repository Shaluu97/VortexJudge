import os
import zipfile
import shutil

def export_packages():
    dist_domjudge = 'dist/domjudge'
    dist_all = 'dist/full_contest'
    os.makedirs(dist_domjudge, exist_ok=True)
    os.makedirs(dist_all, exist_ok=True)

    dirs = sorted([d for d in os.listdir('problems') if d.startswith('p') and os.path.isdir(os.path.join('problems', d))])
    print(f"Exporting {len(dirs)} problems...")

    for d in dirs:
        prob_path = os.path.join('problems', d)
        
        # 1. DOMjudge / Kattis format package
        zip_path = os.path.join(dist_domjudge, f'{d}.zip')
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr('problem.yaml', f'name: "{d}"\ntimelimit: 2.0\n')
            z.write(os.path.join(prob_path, 'solution.cpp'), 'submissions/accepted/solution.cpp')
            if os.path.exists(os.path.join(prob_path, 'statement.md')):
                z.write(os.path.join(prob_path, 'statement.md'), 'problem.md')
                
            t1_in = os.path.join(prob_path, 'tests', '01.in')
            t1_out = os.path.join(prob_path, 'tests', '01.out')
            if os.path.exists(t1_in) and os.path.exists(t1_out):
                z.write(t1_in, 'data/sample/01.in')
                z.write(t1_out, 'data/sample/01.ans')
                
            t2_in = os.path.join(prob_path, 'tests', '02.in')
            t2_out = os.path.join(prob_path, 'tests', '02.out')
            if os.path.exists(t2_in) and os.path.exists(t2_out):
                z.write(t2_in, 'data/secret/02.in')
                z.write(t2_out, 'data/secret/02.ans')

    # 2. Master Contest Zip containing all 15 problems
    master_zip = os.path.join(dist_all, 'number_theory_15_problems_contest.zip')
    with zipfile.ZipFile(master_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for d in dirs:
            prob_path = os.path.join('problems', d)
            for root, _, files in os.walk(prob_path):
                for file in files:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, 'problems')
                    z.write(full_p, rel_p)

    print(f"Export completed!")
    print(f"- Individual DOMjudge packages: {dist_domjudge}/ (15 zips)")
    print(f"- Master contest package: {master_zip}")

if __name__ == '__main__':
    export_packages()
