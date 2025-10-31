import { Unit, CreateIndividualApplicationRequest, UnitError } from '@unit-finance/unit-node-sdk';

const unitClient = new Unit(
  process.env.UNIT_API_KEY!,
  process.env.UNIT_API_URL! // sandbox or production
);

export async function POST(req: Request) {
  const { type, customerId } = await req.json();
  
  try {
    // Step 1: Create individual application
    const createApplicationRequest: CreateIndividualApplicationRequest = {
      type: 'individualApplication',
      attributes: {
        ssn: '000000002', // Test SSN for sandbox
        fullName: unitClient.helpers.createFullName('User', customerId),
        dateOfBirth: '1990-01-01',
        address: unitClient.helpers.createAddress(
          '123 Main St',
          null,
          'San Francisco',
          'CA',
          '94103',
          'US'
        ),
        email: `${customerId}@yourplatform.com`,
        phone: unitClient.helpers.createPhone('1', '5555555555'),
        ip: '127.0.0.1',
        sourceOfIncome: 'EmploymentOrPayrollIncome',
        annualIncome: 'Between50kAnd100k',
        occupation: 'ArchitectOrEngineer'
      }
    };

    const application = await unitClient.applications.create(createApplicationRequest).catch<UnitError>(err => {
      console.error('Application creation error:', err);
      return err;
    });

    // Check if application creation failed
    if ('errors' in application) {
      throw new Error(`Application creation failed: ${JSON.stringify(application.errors)}`);
    }

    console.log('Application created:', application);

    // Step 2: Create deposit account
    // Note: In production, you may need to wait for application approval
    const applicationCustomerId = application.data.relationships.customer?.data.id;
    if (!applicationCustomerId) {
      throw new Error('Customer ID is undefined in the application response.');
    }

    const createAccountRequest = {
      type: 'depositAccount' as const,
      attributes: {
        depositProduct: type === 'savings' ? 'savings' : 'checking',
        tags: {
          purpose: type,
          createdBy: 'daml-app'
        }
      },
      relationships: {
        customer: {
          data: {
            type: 'customer' as const,
            id: applicationCustomerId
          }
        }
      }
    };

    const account = await unitClient.accounts.create(createAccountRequest).catch<UnitError>(err => {
      console.error('Account creation error:', err);
      return err;
    });

    // Check if account creation failed
    if ('errors' in account) {
      throw new Error(`Account creation failed: ${JSON.stringify(account.errors)}`);
    }

    console.log('Account created:', account);

    return new Response(JSON.stringify({
      success: true,
      application: application.data,
      account: account.data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unit API Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create account',
      details: error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}