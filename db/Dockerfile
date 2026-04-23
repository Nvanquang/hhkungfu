FROM postgres:15-alpine

# Set default environment variables for PostgreSQL
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=123456
ENV POSTGRES_DB=hhkungfu

# The official PostgreSQL image gives you a way to run init scripts
# Just add them to /docker-entrypoint-initdb.d/ if you have any
# COPY ./init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
