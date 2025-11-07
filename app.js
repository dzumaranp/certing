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
    
    // --- URL DE TU GOOGLE SHEET ---
    // Este es el enlace que proporcionaste
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQpN7dUtcPMlZcs4-fxsMZtc0iCyxS-vsAPdwE53EfuPPMVNWC_w_x8GuZd9lz7YfCOI_yHjlj7_fha/pub?output=csv';
    // --- FIN DE LA URL ---


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
            // Este parser simple asume que no hay comas "," dentro de tus celdas.
            const columns = row.split(',');
            
            // Columna B es el índice 1 (A=0, B=1, C=2...)
            // Comparamos el código de la Col B (limpio) con el código ingresado
            if (columns.length > 1 && columns[1].trim().toUpperCase() === code) {
                foundRow = columns.map(col => col.trim().replace(/"/g, '')); // Limpia espacios y comillas
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
            // Asegúrate de que el ID del archivo de Drive esté en la Columna H (índice 7)
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
