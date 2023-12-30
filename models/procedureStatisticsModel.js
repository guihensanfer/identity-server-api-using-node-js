class ProcedureStatistics{
    constructor(procedureName, executionTime, sqlCall, ticket, successfully){
        this.procedureName = procedureName;
        this.executionTime = executionTime;
        this.sqlCall = sqlCall;
        this.ticket = ticket;
        this.successfully = successfully;
    }
}

module.exports = ProcedureStatistics;