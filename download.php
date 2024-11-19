<?php
session_start();

if (isset($_SESSION['pdf_content']) && isset($_SESSION['pdf_filename'])) {
    $pdf_content = $_SESSION['pdf_content'];
    $pdf_filename = $_SESSION['pdf_filename'];

    // Define os cabeçalhos para o download do PDF
    header("Content-Type: application/pdf");
    header("Content-Disposition: attachment; filename=\"$pdf_filename\"");
    echo $pdf_content;

    // Limpa a sessão após o download
    unset($_SESSION['pdf_content']);
    unset($_SESSION['pdf_filename']);
    exit();
} else {
    echo "Certificado não encontrado.";
}
?>
