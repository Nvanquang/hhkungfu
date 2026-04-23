FROM gradle:8.5-jdk17-alpine AS builder

WORKDIR /app

# Copy gradle configuration
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./
COPY gradlew.bat ./

# Copy source code
COPY src ./src

# Build the application without running tests for faster build
RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
