
VENV = venv
FLASK_APP = app  

install:
	python3 -m venv $(VENV)
	./$(VENV)/bin/pip install -r requirements.txt

run:
	FLASK_APP=$(FLASK_APP) FLASK_ENV=development ./$(VENV)/bin/flask run --port 3000






