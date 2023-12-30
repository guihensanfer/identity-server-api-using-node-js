drop procedure USP_TEST
create procedure if not exists USP_TEST()
begin
    select 'ITS IS WORKING' as result;
end

drop procedure USP_TEST2
create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;

    
end

drop table if exists ErrorLogs
CREATE TABLE IF NOT EXISTS ErrorLogs (
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

drop procedure if exists USP_ErrorLogs_INSERT
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

drop procedure if exists USP_USERS_SELECT_EXISTS
create procedure if not exists USP_USERS_SELECT_EXISTS(
    in _email varchar(200),
    in _projectId int
)
begin
    select count(1) as result from Users u 
    where u.email = IFNULL(_email, u.email) 
    and u.projectId = IFNULL(_projectId, u.projectId);
end

drop procedure if exists USP_Roles_GET_BY_NAME;
CREATE PROCEDURE IF NOT EXISTS USP_Roles_GET_BY_NAME(
    IN p_roleName TEXT   
)
BEGIN
    select roleId from Roles where name = p_roleName;
END

drop procedure if exists USP_Roles_GET_BY_ID;
CREATE PROCEDURE IF NOT EXISTS USP_Roles_GET_BY_ID(
    IN p_rolesIds VARCHAR(255)
)
BEGIN
    SET @query = CONCAT('SELECT distinct name FROM Roles WHERE roleId IN (', p_rolesIds, ')');
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END

drop table ProcedureStatistics
CREATE TABLE ProcedureStatistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedure_name VARCHAR(255) NOT NULL,
    execution_time_ms INT NOT NULL,
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket varchar(50) null,
    sqlCall LONGTEXT null,
    successfully bit not null,
    INDEX (procedure_name),
    INDEX (execution_date),
    INDEX (ticket)
);

drop procedure USP_ProcedureStatistics_Insert
CREATE PROCEDURE USP_ProcedureStatistics_Insert (
    IN p_procedureName VARCHAR(255),
    IN p_executionTime INT,
    IN p_sqlCall LONGTEXT,
    IN p_ticket varchar(50),
    IN p_successfully bit
)
BEGIN
    INSERT INTO ProcedureStatistics (procedure_name, execution_time_ms, sqlCall, ticket, successfully)
    VALUES (p_procedureName, p_executionTime, p_sqlCall, p_ticket, p_successfully);

    DELETE FROM ProcedureStatistics
    WHERE execution_date < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END

select * from ProcedureStatistics where ticket='14a9fa0e-b37e-442e-a7aa-c20fd1792e42' order by execution_date desc
select * from ErrorLogs order by errortime desc

truncate table ProcedureStatistics