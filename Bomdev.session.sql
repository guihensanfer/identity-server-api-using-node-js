create procedure if not exists USP_TEST()
begin
    select 'ITS IS WORKING';
end

create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;
end

CREATE TABLE IF NOT EXISTS ErrorLogss (
    errorID INT AUTO_INCREMENT PRIMARY KEY,
    errorTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    errorMessage TEXT,
    errorCode INT,
    errorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    errorSource LONGTEXT,
    errorDetails JSON,
    userID INT NULL,
    ipAddress VARCHAR(45),
    ticket varchar(50) null,
    
    INDEX IDXerrorTime (errorTime),
    INDEX IDXerrorSeverity (errorSeverity),
    INDEX IDXuserID (userID),   
    INDEX IDXticket (ticket),    
     
    FOREIGN KEY (userID) REFERENCES Users(userID)
);


CREATE PROCEDURE IF NOT EXISTS USP_ErrorLogs_INSERT(
    IN p_errorMessage TEXT,
    IN p_errorCode INT,
    IN p_errorSeverity ENUM('LOW', 'MEDIUM', 'HIGH'),
    IN p_errorSource LONGTEXT,
    IN p_errorDetails JSON,
    IN p_userID INT,
    IN p_ipAddress VARCHAR(45),
    IN p_ticket varchar(50)
)
BEGIN
    INSERT INTO ErrorLogs (
        errorMessage,
        errorCode,
        errorSeverity,
        errorSource,
        errorDetails,
        userID,
        ipAddress,
        ticket
    )
    VALUES (
        p_errorMessage,
        p_errorCode,
        p_errorSeverity,
        p_errorSource,
        p_errorDetails,
        p_userID,
        p_ipAddress,
        p_ticket
    );

    DELETE FROM ErrorLogs WHERE errorTime < DATE_SUB(NOW(), INTERVAL 6 MONTH);
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

-- SET FOREIGN_KEY_CHECKS=0;
-- drop table Users
-- drop table projects

INSERT INTO projects (    
    Name,
    Description,
    createdAt,
    updatedAt
  )
VALUES (    
    'REP',
    'Revenues, Expensives and Provisions',
    CURRENT_DATE(),
    CURRENT_DATE()
  );

