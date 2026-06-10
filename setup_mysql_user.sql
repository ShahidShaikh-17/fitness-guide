-- Create a new user for the fitness guide application
CREATE USER 'fitness_user'@'localhost' IDENTIFIED BY 'fitness123';

-- Grant all privileges on the fitness_guide database
GRANT ALL PRIVILEGES ON fitness_guide.* TO 'fitness_user'@'localhost';

-- Create the database
CREATE DATABASE IF NOT EXISTS fitness_guide;

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show success message
SELECT 'MySQL user and database created successfully!' as message;
