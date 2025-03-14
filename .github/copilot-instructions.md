Use "uv" instead of directly using pip, pip-tools, pipx, poetry, pyenv, twine, virtualenv, etc.
Use "uv run" to execute python scripts, instead of calling "python" directly.
Use scoop instead of winget.
Use "nodejs-lts" instead of the regular "nodejs".
Do not create virtual environments (venv/.venv) if the current workspace has one already.
Do not force specific package versions in the requirements.txt file.
Always check tests pass after doing file changes, and before attempting completion.
When making code changes, make sure no functionality is lost, unless its intended in the code change itself.
Make sure file name extensions are not duplicated by mistake.
Make sure _not_ to add code block markers at the end of files, unless really intended.
Do not create any new files without explcitly asking the user for permission.
Keep files below 500 lines. For achieving this, very carefully split files into single-purpose files once they become too big.

Extremely important: Increment the version value in the Core file of edited modules, as well as in the module itself, for Violentmonkey's cache bypassing:
"[...].js?v=1" -> "[...].js?v=2" -> "[...].js?v=3"
