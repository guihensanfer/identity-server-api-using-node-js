const cpf = require('cpf-cnpj-validator').cpf;
const cnpj = require('cpf-cnpj-validator').cnpj;


class DocumentTypesModel{
    constructor(documentTypeId, documentValue){
        this.documentTypeId = documentTypeId;
        this.documentValue = documentValue;        
    }
}

function isValid(documentObj){
    var result = {
        valid: true,
        msg:''
    };

    if(!documentObj){        
        result.valid = false;
        result.msg = 'Document is required.'; 
        
        return result;
    }
    else if(!documentObj.documentTypeId){
        result.valid = false;
        result.msg = 'Document Type Id is required.'; 
        
        return result;
    }
    else if(!documentObj.documentValue){        
        result.valid = false;
        result.msg = 'Document value is required.'; 
        
        return result;
    }

    switch(documentObj.documentTypeId){
        case 1:
            // CPF
            if(!cpf.isValid(documentObj.documentValue)){            
                result.valid = false;
                result.msg = 'CPF is invalid.'; 
                
                return result;
            }
            break;
        case 2:
            // CNPJ
            if(!cnpj.isValid(documentObj.documentValue)){            
                result.valid = false;
                result.msg = 'CNPJ is invalid.'; 
                
                return result;
            }
            break;
        default:
            result.valid = false;
            result.msg = 'Invalid Document Type Id.'; 
            
            return result;            
    }
    

    result.valid = true;
    result.msg = ''; 

    return result;
}

module.exports = {
    DocumentTypesModel,
    isValid
};
