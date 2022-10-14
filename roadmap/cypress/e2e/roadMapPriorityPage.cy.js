describe('Road map priorities', () => {
    describe('given a user inputs a new task and clicks the request button', () => {
        it('should clear the request input', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type('Hello World.')
            cy.get('#request_button').click()

            cy.get('#request_input').to.have.string('')
        })
    })
})