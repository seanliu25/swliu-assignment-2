SHELL := /bin/bash

install:
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt

run:
	. venv/bin/activate && FLASK_APP=app.py FLASK_RUN_PORT=3000 flask run
