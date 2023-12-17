CREATE TABLE Users (
    UserId int AUTO_INCREMENT primary key,
    FirstName varchar(100) not null,
    LastName varchar(100),
    Email varchar(200) not null,
    Password varchar(300)
);

go
create procedure USP_USERS_SELECT(in _email varchar(200)) 
begin
    select UserId,
        FirstName,
        LastName,
        Email,
        Password
    from Users
    where email = COALESCE(_email, Email);
end

go

create procedure USP_USERS_SELECT_EXISTS(in _email varchar(200)) 
begin
    select COUNT(1)
    from Users
    where email = COALESCE(_email, Email);
end