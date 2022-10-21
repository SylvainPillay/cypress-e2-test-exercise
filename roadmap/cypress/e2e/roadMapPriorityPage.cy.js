import redis from '../../lib/redis'

describe('Road map priorities', () => {
    beforeEach(async () => {
        await cy.request('http://localhost:3000/api/flush-all');
    })

    describe('given a user inputs a new task and clicks the request button', () => {
        it('should clear the request input', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type('Hello World.')
            cy.get('#request_button').click()

            cy.get('#request_input').should('contain', '')
        })

        it('should add request to list when submit is clicked', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type('Hello World.')
            cy.get('#request_button').click()

            cy.get('.w-full').find('.record-item').should('have.length', 1)
        })

        it('should automatically have your vote.', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type('request should automatically have your vote.')
            cy.get('#request_button').click()

            cy.get('.w-full').find('.record-item .bg-green-100').should('have.length', 1)
        })

        it('should set the vote count to 1.', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type('request should automatically have your vote.')
            cy.get('#request_button').click()

            cy.get('#feature_score').then((el) => {
                expect(el).to.have.text(1)
            })
        })

        it('should show validation message when request input is empty.', () => {
            cy.visit('http://localhost:3000/')
            cy.get('#request_button').click()

            cy.get('#request_input').then((elm) => {
                expect(elm[0].validationMessage).to.eq('Please fill out this field.')
            })
        })

        it('error toast should be displayed when request exceeds 150 characters.', () => {

            cy.visit('http://localhost:3000/')
            cy.get('#request_input').type(getTextWithLengthGreaterThan150())            
            cy.get('#request_button').click()

            cy.get('.go1415219401').then((elm) => {
                expect(elm[0].innerHTML).to.eq('Max 150 characters please.')
            })
        })
    })

    function  getTextWithLengthGreaterThan150() {
        return 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis p';
    }
})