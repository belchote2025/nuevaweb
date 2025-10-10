<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'fila_mariscales');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configuración de PDO
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // En producción, registra el error en lugar de mostrarlo
    error_log('Error de conexión: ' . $e->getMessage());
    die('Error al conectar con la base de datos. Por favor, inténtalo más tarde.');
}

// Función para crear las tablas si no existen
function createDatabaseTables($pdo) {
    $queries = [
        "CREATE TABLE IF NOT EXISTS content_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content_id INT NOT NULL,
            provider ENUM('gdrive', 'mega', 'uptobox', 'mediafire', 'direct') NOT NULL,
            url TEXT NOT NULL,
            quality ENUM('360p', '480p', '720p', '1080p', '4K') NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_checked TIMESTAMP NULL,
            status_updated TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
            INDEX idx_provider (provider),
            INDEX idx_quality (quality),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        
        "CREATE TABLE IF NOT EXISTS link_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            link_id INT NOT NULL,
            user_id INT NULL,
            ip_address VARCHAR(45) NOT NULL,
            user_agent TEXT,
            referrer VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (link_id) REFERENCES content_links(id) ON DELETE CASCADE,
            INDEX idx_link (link_id),
            INDEX idx_user (user_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB;",
        
        "CREATE TABLE IF NOT EXISTS link_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            link_id INT NOT NULL,
            user_id INT NULL,
            reason ENUM('dead_link', 'wrong_content', 'poor_quality', 'other') NOT NULL,
            message TEXT,
            status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP NULL,
            FOREIGN KEY (link_id) REFERENCES content_links(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB;"
    ];
    
    try {
        $pdo->beginTransaction();
        
        foreach ($queries as $query) {
            $pdo->exec($query);
        }
        
        $pdo->commit();
        return true;
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Error al crear tablas: ' . $e->getMessage());
        return false;
    }
}

// Ejecutar la creación de tablas si no existen
createDatabaseTables($pdo);

// Devolver la instancia de PDO
return $pdo;
