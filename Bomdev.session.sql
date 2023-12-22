drop table if exists Users;
CREATE TABLE Users (
    UserId int AUTO_INCREMENT primary key,
    FirstName varchar(100) not null,
    LastName varchar(100),
    Email varchar(200) not null,
    Password varchar(300),
    DateEntered date not null
);

DELIMITER //
drop procedure USP_USERS_SELECT
create procedure USP_USERS_SELECT(in _email varchar(200), IN _currentPage INT, IN _itemsPerPage INT) 
begin 

    DECLARE offsetValue INT DEFAULT 0;
    SET offsetValue = (_currentPage - 1) * _itemsPerPage;

    SELECT UserId,
           FirstName,
           LastName,
           Email,
           Password
    FROM Users
    WHERE Email = IFNULL(_email, Email)
    LIMIT _itemsPerPage OFFSET offsetValue;
end

DELIMITER //

create procedure USP_USERS_SELECT_EXISTS(in _email varchar(200)) 
begin
    select COUNT(1)
    from Users
    where email = COALESCE(_email, Email);
end

DELIMITER //

create procedure USP_TEST()
begin
    select 'ITS IS WORKING';
end

drop procedure USP_TEST2
create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;
end

DELIMITER //

CREATE TABLE ErrorLog (
    ErrorID INT AUTO_INCREMENT PRIMARY KEY,
    ErrorTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ErrorMessage TEXT,
    ErrorCode INT,
    ErrorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    ErrorSource VARCHAR(255),
    ErrorDetails JSON,
    UserID INT NULL,
    IPAddress VARCHAR(45),
    
    INDEX IDXErrorTime (ErrorTime),
    INDEX IDXErrorSeverity (ErrorSeverity),
    INDEX IDXUserID (UserID),    
     
    FOREIGN KEY (UserID) REFERENCES Users(UserId)
);

CREATE PROCEDURE USP_ERRORLOG_INSERT(
    IN p_ErrorMessage TEXT,
    IN p_ErrorCode INT,
    IN p_ErrorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    IN p_ErrorSource VARCHAR(255),
    IN p_ErrorDetails JSON,
    IN p_UserID INT,
    IN p_IPAddress VARCHAR(45)
)
BEGIN
    INSERT INTO ErrorLog (
        ErrorMessage,
        ErrorCode,
        ErrorSeverity,
        ErrorSource,
        ErrorDetails,
        UserID,
        IPAddress
    )
    VALUES (
        p_ErrorMessage,
        p_ErrorCode,
        p_ErrorSeverity,
        p_ErrorSource,
        p_ErrorDetails,
        p_UserID,
        p_IPAddress
    );

    DELETE FROM ErrorLog WHERE ErrorTime < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END 




