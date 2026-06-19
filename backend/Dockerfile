FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY shared-kernel/pom.xml shared-kernel/
COPY module-personnel/pom.xml module-personnel/
COPY module-attendance/pom.xml module-attendance/
COPY module-payroll/pom.xml module-payroll/
COPY module-recruitment/pom.xml module-recruitment/
COPY module-kpi/pom.xml module-kpi/
COPY module-workflow/pom.xml module-workflow/
COPY module-report/pom.xml module-report/
COPY app/pom.xml app/
# Download deps trước (cache layer)
RUN mvn -B dependency:go-offline -q

COPY . .
RUN mvn -B clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
