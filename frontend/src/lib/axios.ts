import Axios from 'axios'

const axios = Axios.create({
	baseURL: process.env.BACKEND_URL || 'http://localhost:5000',
	validateStatus: () => true
})

export default axios
