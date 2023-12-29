class ProcedureStatistics{
    constructor(procedureName, executionTime, sqlCall, ticket){
        this.procedureName = procedureName;
        this.executionTime = executionTime;
        this.sqlCall = sqlCall;
        this.ticket = ticket;
    }
}

module.exports = ProcedureStatistics;