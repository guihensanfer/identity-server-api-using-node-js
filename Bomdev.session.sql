create procedure if not exists USP_TEST()
begin
    select 'ITS IS WORKING';
end

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
    Ticket varchar(50) null,
    
    INDEX IDXErrorTime (ErrorTime),
    INDEX IDXErrorSeverity (ErrorSeverity),
    INDEX IDXUserID (UserID),   
    INDEX IDXTicket (Ticket),    
     
    FOREIGN KEY (UserID) REFERENCES Users(UserId)
);

CREATE PROCEDURE IF NOT EXISTS USP_ERRORLOG_INSERT(
    IN p_ErrorMessage TEXT,
    IN p_ErrorCode INT,
    IN p_ErrorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    IN p_ErrorSource LONGTEXT,
    IN p_ErrorDetails JSON,
    IN p_UserID INT,
    IN p_IPAddress VARCHAR(45),
    IN p_ticket varchar(50)
)
BEGIN
    INSERT INTO ErrorLog (
        ErrorMessage,
        ErrorCode,
        ErrorSeverity,
        ErrorSource,
        ErrorDetails,
        UserID,
        IPAddress,
        ticket
    )
    VALUES (
        p_ErrorMessage,
        p_ErrorCode,
        p_ErrorSeverity,
        p_ErrorSource,
        p_ErrorDetails,
        p_UserID,
        p_IPAddress,
        p_ticket
    );

    DELETE FROM ErrorLog WHERE ErrorTime < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END 

create procedure if not exists USP_USERS_SELECT_EXISTS(
    in _email varchar(200),
    in _projectId int
)
begin
    select count(1) as result from users u 
    where u.email = IFNULL(_email, u.email) 
    and u.projectId = IFNULL(_projectId, u.projectId);
end

select * from users
-- SET FOREIGN_KEY_CHECKS=0;
-- drop table Users
-- drop table projects
