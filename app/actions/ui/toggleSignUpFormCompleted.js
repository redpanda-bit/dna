export default function toggleSignUpFormCompleted(bool) {
	console.log("CALLED WITH", bool)
	return {
		type: "TOGGLE_SIGN_UP_FORM_COMPLETED",
		payload: bool
	}
}