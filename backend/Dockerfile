FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY . .
RUN mvn -B clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-vie
WORKDIR /app
COPY --from=builder /app/app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
