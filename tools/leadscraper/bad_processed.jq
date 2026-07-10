.processed | to_entries[] | select(.value | type \!= "object") | .key
