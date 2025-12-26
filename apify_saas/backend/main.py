# This Python script is setting up and running a web server using the Uvicorn ASGI server. Here's a
# breakdown of what the script is doing:
# Datei: backend/main.py

# This Python script is setting up and running a web server using the Uvicorn ASGI server. Here's a
# breakdown of what the script is doing:
import uvicorn
import os
import sys

# The line `sys.path.append(os.path.dirname(os.path.abspath(__file__)))` in the Python script is
# adding the directory of the current script (`main.py`) to the Python system path. This allows Python
# to locate and import modules or packages from that directory.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# The `if __name__ == "__main__":` block in Python is a common idiom used to ensure that the code
# inside the block is only executed if the script is run directly, and not imported as a module in
# another script.
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)