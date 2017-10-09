import { AsyncStorage } from 'react-native'
import navigateToDashboard from '../ui/navigateToDashboard'
import setUser from './setUser'
import toggleSignUpFormCompleted from '../ui/toggleSignUpFormCompleted'
import User from '../../models/user'

export default function saveUserSignUpInfo(userInfo, navigate) {
	const apiUrl = "https://ana-api.herokuapp.com/api/v1/users"

	return (dispatch) => {

		if (navigate) {
			navigate("NutrientsAnalyser")
			return null
		}
	

		return AsyncStorage.getItem('token')
		.then(token => {
			const requestData = {
		    headers: {
		      'Accept': 'application/json',
		      'Content-Type': 'application/json',
		      'token': token
		    },
				method: 'PUT', 
				body: JSON.stringify(userInfo)
			}
			fetch(apiUrl, requestData)
			.catch(error => console.log("Error while sending signup user info", error))
			.then(res => res.json())
			.catch(error => console.log("Error while converting user to JSON saving signup info", error))
			.then(persistedUserInfo => {

				const user = new User(persistedUserInfo)
				dispatch(setUser(user))
			})
		})
	}
}




