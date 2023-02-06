FROM python:3.10

WORKDIR /app

COPY . .

CMD [ "python3", "-m", "http.server", "7898" ]
