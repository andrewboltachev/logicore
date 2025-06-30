import os
import subprocess


def get_git_info_subprocess(repo_path):
    """
    Gets current Git commit hash and other parameters as a dictionary
    using subprocess to call Git commands, for a given repository path.

    Args:
        repo_path (str): The path to the Git repository.

    Returns:
        dict: A dictionary containing Git commit information, or None if
              not in a Git repository or an error occurs.
    """
    # Ensure the path exists and is a directory
    if not os.path.isdir(repo_path):
        print(f"Error: Directory '{repo_path}' does not exist.")
        return None

    try:
        # Use the 'cwd' argument to execute commands in the specified directory
        commit_hash = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo_path).decode('utf-8').strip()
        short_commit_hash = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=repo_path).decode('utf-8').strip()
        commit_message_subject = subprocess.check_output(['git', 'log', '-1', '--pretty=%s'], cwd=repo_path).decode('utf-8').strip()
        commit_message_full = subprocess.check_output(['git', 'log', '-1', '--pretty=%B'], cwd=repo_path).decode('utf-8').strip()
        author_name = subprocess.check_output(['git', 'log', '-1', '--pretty=%an'], cwd=repo_path).decode('utf-8').strip()
        author_email = subprocess.check_output(['git', 'log', '-1', '--pretty=%ae'], cwd=repo_path).decode('utf-8').strip()
        committer_name = subprocess.check_output(['git', 'log', '-1', '--pretty=%cn'], cwd=repo_path).decode('utf-8').strip()
        committer_email = subprocess.check_output(['git', 'log', '-1', '--pretty=%ce'], cwd=repo_path).decode('utf-8').strip()
        author_date = subprocess.check_output(['git', 'log', '-1', '--pretty=%aI'], cwd=repo_path).decode('utf-8').strip() # ISO 8601
        committer_date = subprocess.check_output(['git', 'log', '-1', '--pretty=%cI'], cwd=repo_path).decode('utf-8').strip() # ISO 8601
        branch_name = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=repo_path).decode('utf-8').strip()

        # Check for uncommitted changes
        is_dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=repo_path).decode('utf-8').strip())

        git_info = {
            'commit_hash': commit_hash,
            'short_commit_hash': short_commit_hash,
            'commit_message_subject': commit_message_subject,
            'commit_message_full': commit_message_full,
            'author_name': author_name,
            'author_email': author_email,
            'committer_name': committer_name,
            'committer_email': committer_email,
            'author_date': author_date,
            'committer_date': committer_date,
            'branch_name': branch_name,
            'is_dirty': is_dirty
        }
        return git_info

    except subprocess.CalledProcessError as e:
        # This occurs if the 'git' command fails (e.g., not a git repo, git not found)
        print(f"Error running git command in '{repo_path}': {e}")
        print(f"Stderr: {e.stderr.decode('utf-8') if e.stderr else 'N/A'}")
        return None
    except FileNotFoundError:
        print("Error: 'git' command not found. Make sure Git is installed and in your PATH.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None