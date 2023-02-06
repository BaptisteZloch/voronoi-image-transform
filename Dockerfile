FROM python:3.10-buster

WORKDIR /app

RUN apt install -y curl

COPY . .

RUN curl -X POST -s --data-urlencode "input=$(cat ./assets/js/main.js)" https://www.toptal.com/developers/javascript-minifier/api/raw > ./assets/js/main.js

CMD [ "python3", "-m", "http.server", "7898" ]
