<?php

session_start();

// Set security headers
header('X-Frame-Options: DENY');
header('Content-Security-Policy: frame-ancestors \'none\'');

// Initialize SQLite database
$db = new SQLite3('profiles.db');

// Create tables if they don't exist
$db->exec('CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    api_key TEXT NOT NULL
)');

$db->exec('CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    FOREIGN KEY (username) REFERENCES users(username)
)');

// Initialize default users if they don't exist
$stmt = $db->prepare('INSERT OR IGNORE INTO users (username, password, api_key) VALUES (:username, :password, :api_key)');

// User credentials
$users = [
    'user' => [
        'password' => 'pass',
        'api_key' => 'user_' . bin2hex(random_bytes(16))
    ],
    'admin' => [
        'password' => 'h4rdPass',
        'api_key' => 'admin_' . bin2hex(random_bytes(16))
    ]
];

foreach ($users as $username => $data) {
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
    $stmt->bindValue(':password', $data['password'], SQLITE3_TEXT);
    $stmt->bindValue(':api_key', $data['api_key'], SQLITE3_TEXT);
    $stmt->execute();
}

// Generate CSRF token if not exists
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Handle profile update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    if (isset($_POST['csrf_token']) && hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $username = $_SESSION['username'];
        $name = $_POST['name'] ?? '';
        $email = htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8');
        
        // Prepare and execute the update query
        $stmt = $db->prepare('INSERT OR REPLACE INTO profiles (username, name, email) VALUES (:username, :name, :email)');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        $stmt->execute();
        
        $success = 'Profile updated successfully';
    } else {
        $error = 'Invalid CSRF token';
    }
}

// Get profile data if user is logged in
$profile = ['name' => '', 'email' => ''];
if (isset($_SESSION['username'])) {
    $stmt = $db->prepare('SELECT name, email FROM profiles WHERE username = :username');
    $stmt->bindValue(':username', $_SESSION['username'], SQLITE3_TEXT);
    $result = $stmt->execute();
    if ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $profile = $row;
    }
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    // Check if user is already logged in
    if (isset($_SESSION['username'])) {
        $error = 'You are already logged in';
    } else {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        $stmt = $db->prepare('SELECT username, password, api_key FROM users WHERE username = :username');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if ($user = $result->fetchArray(SQLITE3_ASSOC)) {
            if ($user['password'] === $password) {
                // Regenerate session ID to prevent session fixation
                session_regenerate_id(true);
                
                $_SESSION['username'] = $user['username'];
                $_SESSION['api_key'] = $user['api_key'];
                header('Location: ' . $_SERVER['PHP_SELF']);
                exit;
            }
        }
        
        $error = 'Invalid username or password';
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}

// Check if user is logged in
$isLoggedIn = isset($_SESSION['username']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>xPossible</title>
    <style>
        :root {
            --bg-color: #1a1a1a;
            --text-color: #ffffff;
            --primary-color: #4a90e2;
            --secondary-color: #2c3e50;
            --accent-color: #3498db;
            --error-color: #e74c3c;
            --success-color: #2ecc71;
            --border-color: #333333;
            --input-bg: #2d2d2d;
            --card-bg: #242424;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }

        .login-form, .profile-form {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .api-key {
            background-color: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            word-break: break-all;
            border: 1px solid var(--border-color);
            margin-bottom: 20px;
        }

        .error {
            color: var(--error-color);
            margin-bottom: 15px;
            padding: 10px;
            background-color: rgba(231, 76, 60, 0.1);
            border-radius: 4px;
            border-left: 4px solid var(--error-color);
        }

        .success {
            color: var(--success-color);
            margin-bottom: 15px;
            padding: 10px;
            background-color: rgba(46, 204, 113, 0.1);
            border-radius: 4px;
            border-left: 4px solid var(--success-color);
        }

        input[type="text"],
        input[type="password"],
        input[type="email"] {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            background-color: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-color);
            font-size: 16px;
            box-sizing: border-box;
        }

        input[type="text"]:focus,
        input[type="password"]:focus,
        input[type="email"]:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        button {
            background-color: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }

        button:hover {
            background-color: var(--accent-color);
        }

        a {
            color: var(--accent-color);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        a:hover {
            color: var(--primary-color);
            text-decoration: underline;
        }

        h2, h3 {
            color: var(--text-color);
            margin-bottom: 20px;
        }

        .profile-section {
            background-color: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color);
        }

        .profile-section p {
            margin: 10px 0;
            padding: 10px;
            background-color: var(--input-bg);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <?php if (!$isLoggedIn): ?>
        <div class="login-form">
            <h2>Login</h2>
            <?php if (isset($error)): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="POST">
                <div>
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div>
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" name="login">Login</button>
            </form>
        </div>
    <?php else: ?>
        <h2>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>!</h2>
        
        <?php if (isset($success)): ?>
            <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <div class="profile-section" style="margin-bottom: 20px;">
            <h3>Your Profile</h3>
            <?php if (!empty($profile['name'])): ?>
                <p>Name: <?php echo $profile['name']; ?></p>
            <?php endif; ?>
            <?php if (!empty($profile['email'])): ?>
                <p>Email: <?php echo $profile['email']; ?></p>
            <?php endif; ?>
        </div>

        <div class="profile-form" style="border: 1px solid #ccc; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3>Update Profile</h3>
            <?php if (isset($error)): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
                <div style="margin-bottom: 10px;">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" value="<?php echo $profile['name']; ?>" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($profile['email']); ?>" required>
                </div>
                <button type="submit" name="update_profile">Update Profile</button>
            </form>
        </div>

        <div class="api-key">
            <h3>Your API Key:</h3>
            <p><?php echo htmlspecialchars($_SESSION['api_key']); ?></p>
        </div>
        <p><a href="?logout=1">Logout</a></p>
    <?php endif; ?>
</body>
</html>