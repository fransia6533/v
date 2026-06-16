# ---- Construcción Simulación ----
n <- 1000
k      <- 1.5
lambda <- 10
set.seed(123)
datos <- rweibull(n = n, shape = k, scale = lambda)

# ---- Exploración Datos ----
media_muestral   <- round(mean(datos),4)
mediana_muestral <- round(median(datos),4)
sd_muestral      <- round(sd(datos),4)

media_teorica   <- round(lambda*gamma(1+1/k),4)
var_teorica     <- lambda^2*(gamma(1+2/k) - gamma(1+1/k)^2)
mediana_teorica <- round(lambda*(log(2))^(1/k),4)
sd_teorica      <- round(sqrt(var_teorica),4)

tabla <- data.frame(
  Medida = c("Tamaño muestra","Media","Mediana","Desviación estándar"),
  Muestral = c(n, media_muestral, mediana_muestral, sd_muestral),
  Teorica  = c(NA, media_teorica, mediana_teorica, sd_teorica)
)
cat("== Tabla exploración ==\n")
print(tabla)

# ---- Gráficos histograma / boxplot ----
png("salida_pregunta4/01_histograma_boxplot.png", width = 1000, height = 500)
par(mfrow = c(1, 2))
hist(datos, breaks = 20, col = "lightblue", border = "black",
     main = "Histograma de tiempos de falla",
     xlab = "Tiempo de falla", ylab = "Frecuencia")
abline(v = media_teorica, col = "red", lty = 2, lwd = 2)
abline(v = mediana_teorica, col = "green", lty = 4, lwd = 2)
legend("topright",
       legend = c(paste0("Media teórica = ", round(media_teorica, 2)),
                  paste0("Mediana teórica = ", round(mediana_teorica, 2))),
       col = c("red", "green"), lty = c(2, 4), lwd = 2)
boxplot(datos, vertical = TRUE, col = "lightblue",
        main = "Boxplot de tiempos de falla",
        ylab = "Tiempo de falla", names = "Tiempos simulados")
abline(h = media_teorica, col = "red", lty = 2, lwd = 2)
abline(h = mediana_teorica, col = "green", lty = 4, lwd = 2)
legend("topright",
       legend = c(paste0("Media teórica = ", round(media_teorica, 2)),
                  paste0("Mediana teórica = ", round(mediana_teorica, 2))),
       col = c("red", "green"), lty = c(2, 4), lwd = 2)
par(mfrow = c(1, 1))
dev.off()

# ---- Distribución a priori / verosimilitud ----
log_verosimilitud <- function(theta, t) {
  theta1 <- theta[1]; theta2 <- theta[2]
  k      <- exp(theta1); lambda <- exp(theta2)
  n  <- length(t)
  n*theta1 + (k-1)*sum(log(t)) - n*k*theta2 - sum((t/lambda)^k)
}
log_prior <- function(theta, t_barra) {
  theta1 <- theta[1]; theta2 <- theta[2]
  log_prior_1 <- -0.5*((theta1 - 0)/ 2)^2
  log_prior_2 <- -0.5*((theta2 - log(t_barra))/2)^2
  log_prior_1 + log_prior_2
}
log_pi <- function(theta, t) {
  t_barra <- mean(t)
  log_verosimilitud(theta, t) + log_prior(theta, t_barra)
}

# ---- Metropolis-Hastings ----
set.seed(123)
N <- 15000
B <- 3000
sigma_q <- 0.05
X <- matrix(0, nrow = N, ncol = 2)
colnames(X) <- c("theta1", "theta2")
X[1, ] <- c(0, round(log(mean(datos)),4))
aceptados <- 0
for (i in 1:(N - 1)) {
  x <- X[i, ]
  y <- x + rnorm(n = 2, mean = 0, sd = sigma_q)
  log_alpha <- log_pi(y, datos) - log_pi(x, datos)
  if (log(runif(1)) <= log_alpha) {
    X[i + 1, ] <- y
    aceptados <- aceptados + 1
  } else {
    X[i + 1, ] <- x
  }
}
total_propuestas <- N - 1
tasa_aceptacion <- aceptados / total_propuestas
muestras_posteriores_usadas <- N - B

tabla_2 <- data.frame(
  Cantidad = c("Número total de propuestas","Propuestas aceptadas",
               "Tasa de aceptación","Iteraciones descartadas como burn-in",
               "Muestras posteriores utilizadas"),
  Valor = c(total_propuestas, aceptados, round(tasa_aceptacion, 4),
            B, muestras_posteriores_usadas)
)
cat("\n== Resumen Metropolis-Hastings ==\n")
print(tabla_2)

primeras_iteraciones <- data.frame(
  Iteracion = 0:9,
  theta1 = round(X[1:10, 1], 4),
  theta2 = round(X[1:10, 2], 4)
)
cat("\n== Primeras iteraciones ==\n")
print(primeras_iteraciones)

# ---- Burn-in ----
X_burn <- X[(B + 1):N, ]
theta1_burn <- X_burn[, 1]
theta2_burn <- X_burn[, 2]
k_burn <- exp(theta1_burn)
lambda_burn <- exp(theta2_burn)
R12_burn <- exp(- (12/lambda_burn)^k_burn)

# ---- Tablas y gráficos finales ----
posteriori_tabla_summary <- function(x) {
  c(media = round(mean(x),4),
    mediana = round(median(x),4),
    desviacion_estandar = round(sd(x),4),
    IC_2.5 = round(quantile(x, 0.025),4),
    IC_97.5 = round(quantile(x, 0.975),4))
}
tabla_resumen <- rbind(
  k = posteriori_tabla_summary(k_burn),
  lambda = posteriori_tabla_summary(lambda_burn),
  R12 = posteriori_tabla_summary(R12_burn)
)
tabla_resumen <- as.data.frame(tabla_resumen)
cat("\n== Tabla resumen posterior ==\n")
print(tabla_resumen)

png("salida_pregunta4/02_diagnosticos_k.png", width = 1000, height = 500)
par(mfrow = c(1, 2))
plot(X[, 1], type = "l", lwd = 0.7,
     main = expression("Trayectoria de " * theta[1]),
     xlab = "Iteración", ylab = expression(theta[1]))
abline(v = B, col = "red", lty = 2, lwd = 2)
hist(k_burn, breaks = 30, col = "lightblue", border = "white",
     main = "Posterior de k", xlab = "k", ylab = "Densidad", probability = TRUE)
abline(v = k, col = "red", lty = 2, lwd = 2)
par(mfrow = c(1, 1))
dev.off()

png("salida_pregunta4/03_diagnosticos_lambda.png", width = 1000, height = 500)
par(mfrow = c(1, 2))
plot(X[, 2], type = "l", lwd = 0.7,
     main = expression("Trayectoria de " * theta[2]),
     xlab = "Iteración", ylab = expression(theta[2]))
abline(v = B, col = "red", lty = 2, lwd = 2)
hist(lambda_burn, breaks = 30, col = "lightblue", border = "white",
     main = expression("Posterior de " * lambda),
     xlab = expression(lambda), ylab = "Densidad", probability = TRUE)
abline(v = lambda, col = "red", lty = 2, lwd = 2)
par(mfrow = c(1, 1))
dev.off()

png("salida_pregunta4/04_posterior_R12.png", width = 600, height = 500)
hist(R12_burn, breaks = 30, col = "lightblue", border = "white",
     main = "Posterior de R(12)", xlab = "R(12)", ylab = "Densidad", probability = TRUE)
dev.off()

# ---- Exportar archivos (ruta adaptada a este entorno) ----
ruta_salida <- "salida_pregunta4"
base_exportar <- data.frame(tiempo = datos)
write.csv(base_exportar, file = file.path(ruta_salida, "base_datos_utilizada.csv"), row.names = FALSE)
muestras_posteriores <- data.frame(
  theta1 = theta1_burn, theta2 = theta2_burn,
  k = k_burn, lambda = lambda_burn, R12 = R12_burn
)
write.csv(muestras_posteriores, file = file.path(ruta_salida, "muestras_posteriores_MH.csv"), row.names = FALSE)
write.csv(tabla_resumen, file = file.path(ruta_salida, "tabla_resumen_posterior.csv"), row.names = TRUE)

cat("\n== Archivos generados en salida_pregunta4/ ==\n")
print(list.files(ruta_salida))
