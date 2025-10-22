import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Modal, Form, Input, Message, Table, Label, Dropdown, Checkbox } from 'semantic-ui-react';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { MultiSigWallet, MultiSigTransferProposal, MultiSigWalletProposal } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/MultiSig';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const MultiSigWallets: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: wallets, loading: walletsLoading } = useStreamQueries(MultiSigWallet);
  const { contracts: transferProposals, loading: proposalsLoading } = useStreamQueries(MultiSigTransferProposal);
  const { contracts: walletProposals, loading: walletProposalsLoading } = useStreamQueries(MultiSigWalletProposal);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  
  const [walletName, setWalletName] = useState('');
  const [selectedSignatories, setSelectedSignatories] = useState<string[]>([]);
  const [requiredSigs, setRequiredSigs] = useState('2');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';
  const isBank = party === bankParty;

  // Filter data
  const myWallets = wallets.filter(w => w.payload.signatories.includes(party));
  const myHoldings = holdings.filter(h => h.payload.owner === party && !h.payload.frozen);
  const myTransferProposals = transferProposals.filter(p => p.payload.wallet.signatories.includes(party));
  const myWalletProposals = walletProposals.filter(p => p.payload.signatories.includes(party));

  const partyOptions = getAllParties()
    .filter(p => p.partyId !== party)
    .map(p => ({
      key: p.partyId,
      text: `${p.displayName} (${p.role})`,
      value: p.partyId,
    }));

  const handleCreateWallet = async () => {
    if (!walletName || selectedSignatories.length === 0 || !requiredSigs || !selectedHolding) {
      showWarning('Please fill in all fields');
      return;
    }

    const reqSigs = parseInt(requiredSigs);
    const allSignatories = [...selectedSignatories, party];

    if (reqSigs > allSignatories.length) {
      showError('Invalid configuration', 'Required signatures cannot exceed number of signatories');
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.create(MultiSigWalletProposal, {
        issuer: selectedHolding.payload.issuer,
        walletId: `WALLET-${Date.now()}`,
        signatories: allSignatories,
        requiredSignatures: requiredSigs,
        initialHoldingCid: selectedHolding.contractId,
      });

      showSuccess('Multi-sig wallet proposal created! Waiting for signatories to approve.');
      setCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      showError('Failed to create wallet proposal', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveWalletProposal = async (proposalCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(MultiSigWalletProposal.ApproveWalletCreation, proposalCid, {
        approver: party,
      });
      showSuccess('Multi-sig wallet created successfully!');
    } catch (error) {
      showError('Failed to approve wallet', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProposeTransfer = async () => {
    if (!selectedWallet || !transferRecipient || !transferAmount) {
      showWarning('Please fill in all fields');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      showError('Invalid amount', 'Amount must be greater than 0');
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.exercise(MultiSigWallet.ProposeMultiSigTransfer, selectedWallet.contractId, {
        proposer: party,
        recipient: transferRecipient,
        amount: transferAmount,
      });

      showSuccess('Transfer proposal created! Awaiting approvals.');
      setTransferModalOpen(false);
      setSelectedWallet(null);
      setTransferRecipient('');
      setTransferAmount('');
    } catch (error) {
      showError('Failed to propose transfer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveTransfer = async (proposalCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(MultiSigTransferProposal.ApproveTransfer, proposalCid, {
        approver: party,
      });
      showSuccess('Transfer approved!');
    } catch (error) {
      showError('Failed to approve transfer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTransfer = async (proposalCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(MultiSigTransferProposal.RejectMultiSigTransfer, proposalCid, {
        rejector: party,
      });
      showSuccess('Transfer rejected');
    } catch (error) {
      showError('Failed to reject transfer', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openTransferModal = (wallet: any) => {
    setSelectedWallet(wallet);
    setTransferRecipient('');
    setTransferAmount('');
    setTransferModalOpen(true);
  };

  const resetCreateForm = () => {
    setWalletName('');
    setSelectedSignatories([]);
    setRequiredSigs('2');
    setSelectedHolding(null);
  };

  if (holdingsLoading || walletsLoading || proposalsLoading || walletProposalsLoading) {
    return <h1>Loading multi-sig wallets...</h1>;
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='users' />
              Multi-Signature Wallets
            </Header>

            {/* Create Wallet Button */}
            <Segment>
              <Button
                color='green'
                size='large'
                fluid
                onClick={() => setCreateModalOpen(true)}
                disabled={myHoldings.length === 0}
              >
                <Icon name='plus circle' />
                Create Multi-Sig Wallet
              </Button>
              {myHoldings.length === 0 && (
                <Message warning style={{ marginTop: '1em' }}>
                  You need stablecoin holdings to create a multi-sig wallet
                </Message>
              )}
            </Segment>

            {/* My Multi-Sig Wallets */}
            <Segment>
              <Header as='h2'>
                <Icon name='briefcase' color='blue' />
                <Header.Content>
                  My Multi-Sig Wallets
                  <Header.Subheader>{myWallets.length} wallet{myWallets.length !== 1 ? 's' : ''}</Header.Subheader>
                </Header.Content>
              </Header>

              {myWallets.length === 0 ? (
                <Message info>No multi-sig wallets yet</Message>
              ) : (
                <Card.Group>
                  {myWallets.map(wallet => {
                    const holding = holdings.find(h => h.contractId === wallet.payload.holdingCid);
                    const balance = holding ? parseFloat(holding.payload.amount) : 0;
                    const currency = holding ? holding.payload.currency : 'USD';

                    return (
                      <Card key={wallet.contractId} fluid color='blue'>
                        <Card.Content>
                          <Card.Header>
                            <Icon name='users' />
                            Wallet: {wallet.payload.walletId}
                          </Card.Header>
                          <Card.Meta>
                            <div>Balance: ${balance.toFixed(2)} {currency}</div>
                            <div>Required Signatures: {wallet.payload.requiredSignatures} of {wallet.payload.signatories.length}</div>
                          </Card.Meta>
                          <Card.Description style={{ marginTop: '1em' }}>
                            <strong>Signatories:</strong>
                            <div style={{ marginTop: '0.5em' }}>
                              {wallet.payload.signatories.map(sig => (
                                <Label key={sig} style={{ marginRight: '0.5em', marginBottom: '0.5em' }}>
                                  <Icon name='user' />
                                  {getDisplayName(sig)}
                                </Label>
                              ))}
                            </div>
                          </Card.Description>
                        </Card.Content>
                        <Card.Content extra>
                          <Button
                            color='blue'
                            fluid
                            onClick={() => openTransferModal(wallet)}
                            disabled={balance === 0 || isProcessing}
                          >
                            <Icon name='paper plane' />
                            Propose Transfer
                          </Button>
                        </Card.Content>
                      </Card>
                    );
                  })}
                </Card.Group>
              )}
            </Segment>

            {/* Pending Wallet Proposals */}
            {myWalletProposals.length > 0 && (
              <Segment>
                <Header as='h2'>
                  <Icon name='hourglass half' color='orange' />
                  Pending Wallet Proposals
                </Header>

                <Card.Group>
                  {myWalletProposals.map(proposal => (
                    <Card key={proposal.contractId} fluid color='orange'>
                      <Card.Content>
                        <Card.Header>New Multi-Sig Wallet</Card.Header>
                        <Card.Meta>
                          Required: {proposal.payload.requiredSignatures} of {proposal.payload.signatories.length} signatures
                        </Card.Meta>
                        <Card.Description style={{ marginTop: '1em' }}>
                          <strong>Proposed Signatories:</strong>
                          <div style={{ marginTop: '0.5em' }}>
                            {proposal.payload.signatories.map(sig => (
                              <Label key={sig} size='small' style={{ marginRight: '0.5em' }}>
                                {getDisplayName(sig)}
                              </Label>
                            ))}
                          </div>
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        <Button
                          positive
                          onClick={() => handleApproveWalletProposal(proposal.contractId)}
                          disabled={isProcessing}
                        >
                          <Icon name='check' />
                          Approve
                        </Button>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              </Segment>
            )}

            {/* Pending Transfer Proposals */}
            {myTransferProposals.length > 0 && (
              <Segment>
                <Header as='h2'>
                  <Icon name='clipboard list' color='purple' />
                  Pending Transfer Proposals
                </Header>

                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Wallet</Table.HeaderCell>
                      <Table.HeaderCell>Proposer</Table.HeaderCell>
                      <Table.HeaderCell>Recipient</Table.HeaderCell>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Approvals</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {myTransferProposals.map(proposal => {
                      const alreadyApproved = proposal.payload.approvers.includes(party);
                      const approvalsNeeded = proposal.payload.wallet.requiredSignatures;
                      const currentApprovals = proposal.payload.approvers.length;

                      return (
                        <Table.Row key={proposal.contractId}>
                          <Table.Cell>{proposal.payload.wallet.walletId}</Table.Cell>
                          <Table.Cell>{getDisplayName(proposal.payload.proposer)}</Table.Cell>
                          <Table.Cell>{getDisplayName(proposal.payload.recipient)}</Table.Cell>
                          <Table.Cell>
                            <strong>${parseFloat(proposal.payload.amount).toFixed(2)}</strong>
                          </Table.Cell>
                          <Table.Cell>
                            <Label color={currentApprovals >= parseInt(approvalsNeeded) ? 'green' : 'orange'}>
                              {currentApprovals} / {approvalsNeeded}
                            </Label>
                          </Table.Cell>
                          <Table.Cell>
                            {alreadyApproved ? (
                              <Label color='green'>
                                <Icon name='check' />
                                You approved
                              </Label>
                            ) : (
                              <Button.Group size='small'>
                                <Button
                                  positive
                                  onClick={() => handleApproveTransfer(proposal.contractId)}
                                  disabled={isProcessing}
                                >
                                  <Icon name='check' />
                                  Approve
                                </Button>
                                <Button
                                  negative
                                  onClick={() => handleRejectTransfer(proposal.contractId)}
                                  disabled={isProcessing}
                                >
                                  <Icon name='close' />
                                  Reject
                                </Button>
                              </Button.Group>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </Segment>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Create Wallet Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='users' color='green' />
          Create Multi-Signature Wallet
        </Modal.Header>
        <Modal.Content>
          <Message info>
            <Message.Header>Joint Control</Message.Header>
            <p>Create a wallet that requires multiple parties to approve transactions. Perfect for corporate accounts or shared funds.</p>
          </Message>
          <Form>
            <Form.Field required>
              <label>Wallet Name</label>
              <Input
                placeholder='e.g., Corporate Treasury, Joint Account...'
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
              />
            </Form.Field>

            <Form.Field required>
              <label>Select Initial Holding</label>
              <Card.Group>
                {myHoldings.map(holding => (
                  <Card
                    key={holding.contractId}
                    fluid
                    color={selectedHolding?.contractId === holding.contractId ? 'green' : undefined}
                    onClick={() => setSelectedHolding(holding)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Content>
                      <Card.Header>
                        {selectedHolding?.contractId === holding.contractId && <Icon name='check circle' color='green' />}
                        ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                      </Card.Header>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Form.Field>

            <Form.Field required>
              <label>Select Co-Signatories</label>
              <Dropdown
                placeholder='Select parties...'
                fluid
                multiple
                search
                selection
                options={partyOptions}
                value={selectedSignatories}
                onChange={(e, { value }) => setSelectedSignatories(value as string[])}
              />
              <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                You will automatically be added as a signatory
              </div>
            </Form.Field>

            <Form.Field required>
              <label>Required Signatures</label>
              <Input
                type='number'
                placeholder='e.g., 2'
                value={requiredSigs}
                onChange={(e) => setRequiredSigs(e.target.value)}
                min='1'
                max={selectedSignatories.length + 1}
              />
              <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                Out of {selectedSignatories.length + 1} total signatories
              </div>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setCreateModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={!walletName || selectedSignatories.length === 0 || !requiredSigs || !selectedHolding || isProcessing}
            loading={isProcessing}
            onClick={handleCreateWallet}
          >
            <Icon name='check' />
            Create Wallet
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Propose Transfer Modal */}
      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='paper plane' color='blue' />
          Propose Transfer
        </Modal.Header>
        <Modal.Content>
          {selectedWallet && (
            <>
              <Segment color='blue'>
                <Header as='h4'>Wallet Info</Header>
                <p><strong>Wallet:</strong> {selectedWallet.payload.walletId}</p>
                <p><strong>Required Approvals:</strong> {selectedWallet.payload.requiredSignatures} of {selectedWallet.payload.signatories.length}</p>
              </Segment>

              <Form>
                <Form.Field required>
                  <label>Recipient</label>
                  <Dropdown
                    placeholder='Select recipient'
                    fluid
                    search
                    selection
                    options={partyOptions}
                    value={transferRecipient}
                    onChange={(e, { value }) => setTransferRecipient(value as string)}
                  />
                </Form.Field>

                <Form.Field required>
                  <label>Amount</label>
                  <Input
                    type='number'
                    placeholder='Enter amount...'
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    step='0.01'
                    min='0.01'
                  />
                </Form.Field>
              </Form>
            </>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setTransferModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='blue'
            disabled={!transferRecipient || !transferAmount || isProcessing}
            loading={isProcessing}
            onClick={handleProposeTransfer}
          >
            <Icon name='check' />
            Propose Transfer
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default MultiSigWallets;