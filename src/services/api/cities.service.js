import cities from '../../data/cities.json'

// No server endpoint yet: the city list comes from src/data/cities.json (the client's Excel list).
export const getCities = async () => cities
