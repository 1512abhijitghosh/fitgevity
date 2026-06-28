# Here are your Instructions
# fitgevity

# Run backend
cd C:\Abhijit\personal\devineBot\fitgevity\backend
# start MongoDB separately on localhost:27017
.\.venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload