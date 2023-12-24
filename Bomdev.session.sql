SET FOREIGN_KEY_CHECKS=0; -- to disable them

drop table if exists Projects;
create table Projects(
    ProjectId int AUTO_INCREMENT primary key,
    Name varchar(50) not null,
    Description varchar(100) null
)

create table DocumentTypes
(
    DocumentTypeId int AUTO_INCREMENT primary key,
    Name varchar(20) not null,
    Description varchar(100) null,
    Country varchar(50) not null
)


INSERT INTO DocumentTypes (Name, Description, Country)
VALUES (    
    'CPF',
    'Cadastro de Pessoas Física',
    'Brasil'
  );

INSERT INTO DocumentTypes (Name, Description, Country)
VALUES (    
    'CNPJ',
    'Cadastro Nacional de Pessoas Jurídicas',
    'Brasil'
  );

drop table if exists Users;
CREATE TABLE Users (
    UserId int AUTO_INCREMENT primary key,
    FirstName varchar(100) not null,
    LastName varchar(100),
    Email varchar(200) not null,
    Password varchar(300),
    DateEntered date not null,
    Guid varchar(200) not null,    
    Document varchar(50) null,
    DocumentTypeId int not null,
    ProjectId int not null
);


CREATE INDEX IDX_EMAIL ON Users(Email);

CREATE INDEX IDX_PROJECTID ON Users(ProjectId);

ALTER TABLE Users ADD CONSTRAINT UQ_EMAIL_PROJECTID UNIQUE (Email, ProjectId);

ALTER TABLE Users ADD DefaultLanguage varchar(50) NULL

ALTER TABLE Users
ADD CONSTRAINT FK_USER_PROJECT FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId);

drop procedure if exists USP_USERS_SELECT
create procedure USP_USERS_SELECT(in _userId int, in _email varchar(200), in _projectId int, IN _currentPage INT, IN _itemsPerPage INT) 
begin 

    DECLARE offsetValue INT DEFAULT 0;
    SET offsetValue = (_currentPage - 1) * _itemsPerPage;

    SELECT 
        UserId,
        FirstName,
        LastName,
        Email,
        Password,
        DateEntered,
        Guid,
        CPF,
        CNPJ,
        TipoPessoa,
        ProjectId,        
        DefaultLanguage         
    FROM Users
    WHERE 
        Email = IFNULL(_email, Email)
        and UserId = IFNULL(_userId, UserId)
        and ProjectId = IFNULL(_projectId, ProjectId)
    LIMIT _itemsPerPage OFFSET offsetValue;
end

drop procedure if exists USP_USERS_SELECT_EXISTS
create procedure USP_USERS_SELECT_EXISTS(
    in _email varchar(200),
    in _cpf varchar(12),
    in _cnpj varchar(20)
) 
begin


    select COUNT(1) result
    from Users
    where email = IFNULL(_email, Email);
end


drop procedure if exists USP_TEST
create procedure USP_TEST()
begin
    select 'ITS IS WORKING';
end

drop procedure if exists USP_TEST2
create procedure USP_TEST2(in parameter varchar(200))
begin
    select concat('ITS IS WORKING ', parameter) as result;
    select concat('ITS IS WORKING 2', parameter) as result;
end


drop table if exists ErrorLog
CREATE TABLE ErrorLog (
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

drop procedure if exists USP_ERRORLOG_INSERT
CREATE PROCEDURE USP_ERRORLOG_INSERT(
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