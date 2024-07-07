drop procedure if exists USP_TEST;
create procedure if not exists USP_TEST()
begin
    select 'ITS IS WORKING' as result;
end;

drop procedure if exists USP_TEST2;
create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;

    
end;

drop table if EXISTS OperationLogs;
CREATE TABLE OperationLogs (
    operationLogId INT AUTO_INCREMENT PRIMARY KEY,
    procedure_name VARCHAR(255) NOT NULL,
    execution_time_ms INT NOT NULL,
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket varchar(50) null,
    sqlCall LONGTEXT null,
    successfully bit not null,
    is_checkpoint bit DEFAULT 0,
    INDEX (procedure_name),
    INDEX (execution_date),
    INDEX (ticket),
    INDEX (is_checkpoint),    

    FOREIGN KEY (ticket) REFERENCES HttpRequestsLogs(ticket)
);

drop procedure if exists USP_OperationLogs_Insert;
CREATE PROCEDURE USP_OperationLogs_Insert (
    IN p_procedureName VARCHAR(255),
    IN p_executionTime INT,
    IN p_sqlCall LONGTEXT,
    IN p_ticket varchar(50),
    IN p_successfully bit,    
    IN p_is_checkpoint bit
)
BEGIN
    INSERT INTO OperationLogs (procedure_name, execution_time_ms, sqlCall, ticket, successfully, is_checkpoint)
    VALUES (p_procedureName, p_executionTime, p_sqlCall, p_ticket, p_successfully, p_is_checkpoint);

    DELETE FROM OperationLogs
    WHERE execution_date < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END;

drop table if exists ErrorLogs;
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
     
    FOREIGN KEY (userID) REFERENCES Users(userID),    

    FOREIGN KEY (ticket) REFERENCES HttpRequestsLogs(ticket)
);

drop procedure if exists USP_ErrorLogs_INSERT;
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
END;

drop procedure if exists USP_USERS_SELECT_EXISTS;
create procedure if not exists USP_USERS_SELECT_EXISTS(
    in _email varchar(200),
    in _projectId int,
    in _enabled bit
)
begin
    select count(1) as result from Users u 
    where u.email = IFNULL(_email, u.email) 
    and u.projectId = IFNULL(_projectId, u.projectId)
    and (_enabled is null or u.enabled = _enabled);
end;

drop procedure if exists USP_Roles_GET_BY_NAME;
CREATE PROCEDURE IF NOT EXISTS USP_Roles_GET_BY_NAME(
    IN p_roleName TEXT   
)
BEGIN
    select roleId from Roles where name = p_roleName;
END;

drop procedure if exists USP_Roles_GET_BY_ID;
CREATE PROCEDURE IF NOT EXISTS USP_Roles_GET_BY_ID(
    IN p_rolesIds VARCHAR(255)
)
BEGIN
    SET @query = CONCAT('SELECT distinct name FROM Roles WHERE roleId IN (', p_rolesIds, ')');
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

drop table if exists UserToken;
CREATE TABLE UserToken (
    userTokenId INT AUTO_INCREMENT PRIMARY KEY,
    userID int NOT NULL,
    token varchar(50) NOT NULL,
    expiredAt TIMESTAMP NOT NULL,
    requestIp varchar(50) null,
    processName varchar(50) null,

    INDEX (requestIp, token),

    FOREIGN KEY (userID) REFERENCES Users(userID)
);

drop procedure if exists USP_UserToken_Insert;
CREATE PROCEDURE USP_UserToken_Insert (
    IN p_userID INT,
    IN p_requestIP VARCHAR(50) ,
    IN p_expiredAt    TIMESTAMP,
    IN p_processName varchar(50),
    IN p_data varchar(500)
)
BEGIN
    DECLARE newToken char(40);

    set newToken = UUID();    

    INSERT INTO UserToken (userID, token, expiredAt, requestIp, processName, data)
    VALUES (p_userID, newToken, p_expiredAt, p_requestIP, p_processName, p_data);

    DELETE FROM UserToken
    WHERE expiredAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);

    select newToken as result;
END;

drop procedure if exists USP_UserToken_Check;
CREATE PROCEDURE USP_UserToken_Check (
    IN p_token VARCHAR(50),    
    IN p_requestIP VARCHAR(50)
)
BEGIN
    -- Tabela temporária para armazenar os resultados
    CREATE TEMPORARY TABLE tempResult (
        userId INT,
        processName VARCHAR(50),
        data varchar(500)
    );

    -- Inserindo os dados correspondentes na tabela temporária
    INSERT INTO tempResult (userId, processName, data)
    SELECT userID, processName, data 
    FROM UserToken 
    WHERE token = p_token     
    AND (p_requestIP IS NULL OR requestIp = p_requestIP)
    AND enabled = 1
    AND expiredAt > NOW()    
    LIMIT 1;

    -- Selecionando o userId como resultado
    SELECT userId AS result, data FROM tempResult;

    -- Excluindo o token atual e outros tokens antigos semelhantes
    UPDATE UserToken ut
    INNER JOIN tempResult tr ON ut.userId = tr.userId AND ut.processName = tr.processName
    SET ut.enabled = 0,
        ut.disabledDate = NOW();

    -- Limpando a tabela temporária
    DROP TEMPORARY TABLE IF EXISTS tempResult;
END;

drop table if exists EmailLogs;
CREATE TABLE IF NOT EXISTS EmailLogs (
    emailLogId INT AUTO_INCREMENT PRIMARY KEY,
    to_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    try_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    projectId int not null,
    successfully bit,
    result_object JSON,
    ticket varchar(50) not null,

    FOREIGN KEY (projectId) REFERENCES Projects(projectId),
    FOREIGN KEY (ticket) REFERENCES HttpRequestsLogs(ticket)
);


drop procedure if exists USP_InsertEmailLog;
CREATE PROCEDURE USP_InsertEmailLog(IN p_to_address VARCHAR(255), IN p_subject VARCHAR(255), IN p_body LONGTEXT, IN p_projectId int, p_result_object JSON, p_successfully bit, p_ticket varchar(50))
BEGIN
    INSERT INTO EmailLogs (to_address, subject, body, projectid, result_object, successfully,ticket)
    VALUES (p_to_address, p_subject, p_body, p_projectId, p_result_object, p_successfully,p_ticket);

    DELETE FROM EmailLogs
    WHERE try_sent_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END;

alter table Users add if not exists emailConfirmed bit default 0;
alter table Users add if not exists enabled bit default 1;
alter table UserToken add if not exists  enabled bit not null default 1;
alter table UserToken add if not exists  disabledDate datetime null;
alter table Users add if not exists  picture varchar(200) null;
alter table UserToken add if not exists data varchar(500) null;

alter table Projects add picture varchar(200) null;

drop procedure if exists USP_OAUTH_CONTEXT_SELECT;
create procedure USP_OAUTH_CONTEXT_SELECT(in _userIdOP int, in _projectIdOP int, in _secretKeyOP varchar(100))
BEGIN 
    select 
        oa.userId, 
        oa.clientCallbackUri, 
        oa.clientSecret,
        u.firstName,
        u.lastName,
        u.defaultLanguage,
        oa.createdAt,
        oa.enabled as callbackStatus,
        p.projectId,
        p.name as projectName,
        p.description as projectDescription,
        p.picture as projectPicture
    from UsersOAuths oa
    inner join Users u on u.userId = oa.userId
    inner join Projects p on p.projectId = u.projectId
    where (_userIdOP is null or oa.userId = _userIdOP and p.projectId = _projectIdOP)    
    and (_secretKeyOP is null or oa.clientSecret = _secretKeyOP);
END;

----------------------------------------------------------------------------



SET foreign_key_checks = 0;
truncate table ErrorLogs;
truncate table Users;

SET foreign_key_checks = 1;
-- end script


-- select * from ProcedureStatistics 
-- order by execution_date desc
select * from ErrorLogs order by errortime desc

-- truncate table ProcedureStatistics

-- select * from UserRefreshToken

-- call USP_UserRefreshToken_Check('77732974-b18f-11ee-9206-e049c9171833', '::1');
SET foreign_key_checks = 0;
drop table Users
SET foreign_key_checks = 1;

select * from Roles
select * from UsersRoles where userId = 2
update UsersRoles set roleId=2
select * from ErrorLogs order by errorID desc

truncate table Users
truncate table ErrorLogs

select * from Users
delete from Users where userId=4
delete from UserToken where userId = 4;
delete from UsersRoles where userId = 4;
select * from UsersRoles where userId=3

select * from Roles
select * from Projects

select * from EmailLogs order by emaillogid desc

SELECT * FROM UserToken order by userTokenId desc

insert into UserToken(userID, token, expiredAt, requestIp, processName, enabled, disabledDate, data)
values(1, 'teste', '2024-06-18 15:39:47', '1', 'OAUTH_LOGIN', 1, null, '1');
delete from UserToken where userTokenId = 14;


select * from ProcedureStatistics order by execution_date desc


SHOW ENGINE INNODB STATUS;
SHOW CREATE TABLE ErrorLogs;

SHOW CREATE TABLE ErrorLogs;


update Users set emailConfirmed=1 where userId=1
select * from UsersRoles 

update UsersRoles set roleId = 1 where userId = 1

call USP_UserToken_Check('e8a4a57a-de58-11ee-8b5b-841af16f5660', null)
select * from UserToken where token = '5c0d8a1f-dd7e-11ee-b4e8-d08e79e09abc' order by data desc
 SELECT userID, processName, data 
    FROM UserToken 
    WHERE token = 'a18f9293-db38-11ee-b4e8-d08e79e09abc'     
    AND (null IS NULL OR requestIp = 1)
    AND enabled = 1
    AND expiredAt > NOW()    
    LIMIT 1;

----------

select * from EmailLogs order by emailLogId desc

update Users set emailConfirmed = 1

select * from HttpRequestsLogs  order by createdAt desc
select * from OperationLogs 
order by operationLogId desc
--where ticket= '5ca0d10a-95ad-40c4-8f4d-d7b89855a52a' 
order by operationLogId desc

select * from ErrorLogs order by errorID desc


select * from UsersOAuths