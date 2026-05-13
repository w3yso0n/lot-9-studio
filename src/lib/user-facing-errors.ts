function pgCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  const c = (error as { code: unknown }).code;
  return typeof c === "string" ? c : undefined;
}

/** Mensaje seguro para guardar producto (BD u otros fallos en servidor). */
export function toUserFacingProductSaveError(error: unknown): string {
  const code = pgCode(error);
  if (code === "23505") {
    return "Ese dato ya existe en la base de datos (duplicado). Revisa nombre o combinación de tallas.";
  }
  if (code === "23503") {
    return "No se pudo enlazar un dato relacionado. Recarga la página e inténtalo de nuevo.";
  }
  if (code === "23502" || code === "23514") {
    return "Faltan datos obligatorios o un valor no cumple las reglas de la base de datos. Revisa precio, nombre e imágenes.";
  }
  if (code === "42P01" || code === "42703") {
    return "La base de datos no está al día con el esquema esperado. Revisa migraciones en el servidor.";
  }

  if (error instanceof Error) {
    const m = error.message;
    if (/DATABASE_URL/i.test(m)) {
      return "El servidor no tiene configurada la conexión a la base de datos. Contacta a quien administra el sitio.";
    }
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(m)) {
      return "No se pudo conectar con la base de datos. Inténtalo más tarde o avisa si el problema continúa.";
    }
    if (/password authentication failed|28P01/i.test(m)) {
      return "Error de acceso a la base de datos (credenciales). Quien administra el servidor debe revisar la configuración.";
    }
  }

  return "No se pudo guardar el producto. Revisa los datos e inténtalo de nuevo. Si sigue fallando, contacta con soporte.";
}

/** Fallos al escribir subidas en disco (p. ej. Vercel: FS de solo lectura). */
export function toUserFacingUploadError(error: unknown): string {
  const errno = error as NodeJS.ErrnoException;
  if (errno?.code === "EROFS" || errno?.code === "EPERM") {
    return "En este servidor no se puede guardar archivos en disco (entorno de solo lectura). Configura Cloudinary (CLOUDINARY_*) para subidas en producción.";
  }
  if (errno?.code === "ENOSPC") {
    return "No hay espacio suficiente en el servidor para guardar la imagen.";
  }
  if (errno?.code === "ENOENT") {
    return "No se encontró la carpeta de subidas en el servidor. Revisa el despliegue.";
  }

  if (error instanceof Error && /read-only|EROFS|EPERM/i.test(error.message)) {
    return "No se puede escribir en el disco del servidor. Este entorno suele requerir almacenamiento de archivos en la nube.";
  }
  if (error instanceof Error && /cloudinary|signature|api key|api secret|invalid/i.test(error.message)) {
    return "La subida a Cloudinary falló. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.";
  }

  return "No se pudo subir la imagen. Prueba con otro archivo (JPEG, PNG, WebP o GIF, máx. 5 MB) o inténtalo más tarde.";
}
