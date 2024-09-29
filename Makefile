install:
	python3 -m venv venv
	source venv/bin/activate && pip install -r requirements.txt

run:
	source venv/bin/activate && FLASK_APP=app.py FLASK_RUN_PORT=3000 flask run
