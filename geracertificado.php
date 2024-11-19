<?php
require('fpdf/fpdf.php');

session_start(); // Inicia a sessão para armazenar o PDF temporariamente

class PDF extends FPDF {
    function Header() {
        $this->Image('cert-ppt.png', 0, 0, 297, 210);
        $this->SetFont('Arial', 'B', 16);
        $this->SetY(10);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo(), 0, 0, 'C');
    }
}

// Nome completo vindo do formulário
$nomecompleto = isset($_POST['nomecompleto']) ? $_POST['nomecompleto'] : '';
$nomecompleto = strtoupper($nomecompleto); // Converte para maiúsculas

// Gera o hash do nome completo
$hash = hash('sha256', $nomecompleto);

// Caminho do arquivo CSV
$csv_file = 'certificados.csv';

// Inicializa o arquivo CSV se ele não existir
if (!file_exists($csv_file)) {
    $fp = fopen($csv_file, 'w'); // Cria o arquivo
    fputcsv($fp, ['Nome Completo', 'Hash', 'Data'], ';'); // Adiciona o cabeçalho
    fclose($fp);
}

// Verifica se o hash já está no arquivo CSV
$hash_exists = false;
if (($fp = fopen($csv_file, 'r')) !== false) {
    while (($row = fgetcsv($fp, 1000, ';')) !== false) {
        if (isset($row[1]) && $row[1] === $hash) { // Verifica se o hash já existe na segunda coluna
            $hash_exists = true;
            break;
        }
    }
    fclose($fp);
}

// Redireciona para erro.html se o hash já existir
if ($hash_exists) {
    header("Location: erro.html");
    exit();
}

// Cria uma instância da classe PDF
$pdf = new PDF('L', 'mm', 'A4');
$pdf->AddPage();
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetX(30);
$pdf->Cell(0, 150, "$nomecompleto", 0, 1, 'L');

// Salva o PDF em memória
$pdf_content = $pdf->Output('S'); // Armazena o conteúdo do PDF como string

// Armazena o PDF na sessão
$_SESSION['pdf_content'] = $pdf_content;
$_SESSION['pdf_filename'] = $nomecompleto . ".pdf";

// Data e hora atual no formato desejado
$data = date('d-m-Y H:i:s');

// Adiciona os dados ao arquivo CSV
if (($fp = fopen($csv_file, 'a')) !== false) {
    fputcsv($fp, [$nomecompleto, $hash, $data], ';');
    fclose($fp);
}

// Redireciona para a página de sucesso
header("Location: sucesso.html");
exit();
?>
