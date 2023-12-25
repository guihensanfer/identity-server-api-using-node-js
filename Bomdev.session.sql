drop procedure  USP_TEST
create procedure if not exists USP_TEST()
begin
    select 'ITS IS WORKING';
end

drop procedure if exists USP_TEST2
create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;
end

CREATE TABLE IF NOT EXISTS ErrorLog (
    ErrorID INT AUTO_INCREMENT PRIMARY KEY,
    ErrorTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ErrorMessage TEXT,
    ErrorCode INT,
    ErrorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    ErrorSource LONGTEXT,
    ErrorDetails JSON,
    UserID INT NULL,
    IPAddress VARCHAR(45),
    
    INDEX IDXErrorTime (ErrorTime),
    INDEX IDXErrorSeverity (ErrorSeverity),
    INDEX IDXUserID (UserID),    
     
    FOREIGN KEY (UserID) REFERENCES Users(UserId)
);

CREATE PROCEDURE IF NOT EXISTS USP_ERRORLOG_INSERT(
    IN p_ErrorMessage TEXT,
    IN p_ErrorCode INT,
    IN p_ErrorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    IN p_ErrorSource LONGTEXT,
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