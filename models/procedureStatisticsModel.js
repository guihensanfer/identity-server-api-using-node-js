class ProcedureStatistics{
    constructor(procedureName, executionTime, sqlCall){
        this.procedureName = procedureName;
        this.executionTime = executionTime;
        this.sqlCall = sqlCall;
    }
}

module.exports = ProcedureStatistics;