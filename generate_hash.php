<?php
$password = 'admin123';
$hashed_password = password_hash($password, PASSWORD_DEFAULT);
echo "Hashed password for 'admin123': " . $hashed_password;
?>
