// Espera a que el contenido del DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
    
    // Encuentra el formulario en la página
    const validationForm = document.getElementById("validation-form");
    
    if (validationForm) {
        validationForm.addEventListener("submit", function(e) {
            e.preventDefault(); // Evita que la página se recargue
            
            const codeInput = document.getElementById("codigo-input").value.trim().toUpperCase();
            
            if (codeInput) {
                // Inicia el proceso de validación
                validateCertificate(codeInput);
            }
        });
    }
});

/**
 * Función principal para validar el certificado
 * @param {string} code - El código a buscar
 */
async function validateCertificate(code) {
    
    // --- IMPORTANTE: CONFIGURACIÓN ---
    // 1. Ve a tu Google Sheet.
    // 2. Haz clic en "Archivo" > "Compartir" > "Publicar en la web".
    // 3. Elige "Toda la hoja" (o la hoja específica) y "Valores separados por comas (.csv)".
    // 4. Haz clic en "Publicar" y copia el enlace que te da.
    // 5. Pega ese enlace aquí abajo.
    const GOOGLE_SHEET_CSV_URL = 'URL_DE_TU_GOOGLE_SHEET_PUBLICADO_COMO_CSV';

    // --- FIN DE CONFIGURACIÓN ---


    // Seleccionar elementos del DOM para mostrar resultados
    const loadingSpinner = document.getElementById("loading-spinner");
    const resultsContainer = document.getElementById("results-container");
    const successData = document.getElementById("success-data");
    const errorMessage = document.getElementById("error-message");
    const certText = document.getElementById("certificate-text");
    const certImage = document.getElementById("certificate-image");

    // 1. Reiniciar la interfaz
    loadingSpinner.style.display = "block";
    resultsContainer.style.display = "none";
    successData.style.display = "none";
    errorMessage.style.display = "none";
    certText.innerHTML = "";
    certImage.innerHTML = "";

    // Seguridad: Verifica que la URL no sea la de placeholder
    if (GOOGLE_SHEET_CSV_URL === 'URL_DE_TU_GOOGLE_SHEET_PUBLICADO_COMO_CSV') {
        loadingSpinner.style.display = "none";
        errorMessage.style.display = "block";
        errorMessage.innerText = "Error de configuración: La URL de Google Sheets no ha sido configurada en app.js.";
        return;
    }

    try {
        // 2. Realizar la petición (fetch) al CSV
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error("No se pudo conectar a la base de datos.");
        }
        
        const csvData = await response.text();
        
        // 3. Procesar el CSV
        // Divide el texto en filas, saltándose la fila del encabezado (fila 0)
        const rows = csvData.split('\n').slice(1);
        let foundRow = null;

        for (const row of rows) {
            // Divide cada fila en columnas. 
            // Google Sheets CSV puede tener comas dentro de comillas, pero este parser simple no lo maneja.
            // Asumimos datos simples sin comas internas.
            const columns = row.split(',');
            
            // Columna B es el índice 1 (A=0, B=1, C=2...)
            // Comparamos el código de la Col B (limpio) con el código ingresado
            if (columns.length > 1 && columns[1].trim().toUpperCase() === code) {
                foundRow = columns.map(col => col.trim()); // Limpia espacios en todas las columnas
                break; // Detenemos la búsqueda al encontrarlo
            }
        }

        // 4. Mostrar Resultados
        if (foundRow) {
            // Extraer datos según tu solicitud
            // C = 2, D = 3, E = 4, F = 5, G = 6
            const colC = foundRow[2]; // Nombres
            const colD = foundRow[3]; // Apellidos
            const colE = foundRow[4]; // Curso
            const colF = foundRow[5]; // Duración
            const colG = foundRow[6]; // Promedio

            // IMPORTANTE: ID de la imagen de Google Drive
            // Debes agregar el ID del archivo de Google Drive en la Columna H (índice 7)
            const googleDriveFileId = foundRow[7]; 

            // Construir el texto
            const textHTML = `
                <strong>${colC} ${colD}</strong>
                ha aprobado satisfactoriamente el curso de
                <span>"${colE}"</span>,
                el cual tuvo una duración de <span>${colF}</span>,
                obteniendo como promedio del curso <span>${colG}</span>.
                <br><br>
                <p><em>En caso de requerir una copia del certificado original contactarse con certificado@certing.pe.</em></p>
            `;
            
            // Construir la URL de la imagen (baja resolución)
            // Esta URL especial de Google Drive fuerza la visualización directa
            const imageURL = `https://drive.google.com/uc?export=view&id=${googleDriveFileId}`;
            const imageHTML = `<img src="${imageURL}" alt="Vista previa del Certificado">`;

            // Mostrar resultados
            certText.innerHTML = textHTML;
            certImage.innerHTML = imageHTML;
            successData.style.display = "grid"; // Usamos grid como en el CSS
            resultsContainer.style.display = "block";

        } else {
            // No se encontró el código
            errorMessage.style.display = "block";
            errorMessage.innerText = "Código no válido. Verifique el código e intente nuevamente. Si el problema persiste, contacte a certificado@certing.pe.";
        }

    } catch (error) {
        // Error de red o al procesar
        console.error("Error en la validación:", error);
        errorMessage.style.display = "block";
        errorMessage.innerText = "Error al conectar con el servidor de validación. Intente más tarde.";
    } finally {
        // 5. Ocultar el 'cargando' en cualquier caso
        loadingSpinner.style.display = "none";
    }
}