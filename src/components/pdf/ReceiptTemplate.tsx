import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 12,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    section: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 10,
        color: 'gray',
    },
});

interface ReceiptProps {
    tenant: {
        firstName: string;
        lastName: string;
        address: string;
        postalCode: string;
        city: string;
        startDate: Date; // Ajout date entrée
        property?: {
            name: string;
            address: string;
            postalCode: string;
            city: string;
        } | null;
    };
    landlord?: {
        companyName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        address?: string | null;
        postalCode?: string | null;
        city?: string | null;
        email?: string | null;
        siret?: string | null;
    } | null;
    period: {
        start: Date;
        end: Date;
    };
    amount: {
        rent: number;
        charge: number;
        total: number;
        caf?: number;
    };
    paymentDate: Date;
    date: Date;
}

export const ReceiptDocument = ({ tenant, landlord, period, amount, date }: ReceiptProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>QUITTANCE DE LOYER</Text>

            <View style={styles.header}>
                <View>
                    <Text style={styles.bold}>BAILLEUR</Text>
                    <Text>{landlord ? (landlord.companyName || `${landlord.firstName} ${landlord.lastName}`) : "Agence / Propriétaire"}</Text>
                    {landlord?.address && <Text>{landlord.address}</Text>}
                    {landlord?.postalCode && landlord?.city && <Text>{landlord.postalCode} {landlord.city}</Text>}
                    {landlord?.email && <Text>{landlord.email}</Text>}
                    {landlord?.siret && <Text style={{ fontSize: 9, marginTop: 2 }}>SIRET : {landlord.siret}</Text>}
                </View>
                <View>
                    <Text style={styles.bold}>LOCATAIRE</Text>
                    <Text>{tenant.firstName} {tenant.lastName}</Text>
                    <Text>{tenant.address}</Text>
                    <Text>{tenant.postalCode} {tenant.city}</Text>
                    <Text style={{ fontSize: 10, marginTop: 5, color: '#444' }}>
                        Entrée dans les lieux le : {new Date(tenant.startDate).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text>
                    <Text style={styles.bold}>Adresse de location : </Text>
                    {tenant.property ? (
                        <>
                            {tenant.property.name} - {tenant.property.address}, {tenant.property.postalCode} {tenant.property.city}
                        </>
                    ) : (
                        <>
                            {tenant.address}, {tenant.postalCode} {tenant.city}
                        </>
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text>
                    <Text style={styles.bold}>Période : </Text>
                    du {period.start.toLocaleDateString('fr-FR')} au {period.end.toLocaleDateString('fr-FR')}
                </Text>
            </View>

            <View style={{ marginTop: 20, marginBottom: 20, borderTop: 1, borderBottom: 1, paddingRight: 10 }}>
                <View style={[styles.row, { marginTop: 10 }]}>
                    <Text>Loyer hors charges</Text>
                    <Text>{amount.rent.toFixed(2)} €</Text>
                </View>
                <View style={styles.row}>
                    <Text>Provision pour charges</Text>
                    <Text>{amount.charge.toFixed(2)} €</Text>
                </View>
                {/* Ajout ligne CAF */}
                {(amount.caf && amount.caf > 0) ? (
                    <View style={styles.row}>
                        <Text>Allocation Logement (CAF)</Text>
                        <Text>- {amount.caf.toFixed(2)} €</Text>
                    </View>
                ) : null}
                <View style={[styles.row, { marginTop: 10, borderTop: 1, paddingTop: 5 }]}>
                    <Text style={styles.bold}>TOTAL PAYÉ PAR LE LOCATAIRE</Text>
                    <Text style={styles.bold}>{(amount.total - (amount.caf || 0)).toFixed(2)} €</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text>
                    Je soussigné déclare avoir reçu de M/Mme {tenant.lastName} la somme de {(amount.total - (amount.caf || 0)).toFixed(2)} euros
                    {(amount.caf && amount.caf > 0) ? ` (ainsi que ${amount.caf.toFixed(2)} euros d'allocation logement de la CAF) ` : ''}
                    correspondant au loyer et aux charges pour la période citée ci-dessus.
                </Text>
            </View>

            <View style={styles.section}>
                <Text>Fait à Paris, le {date.toLocaleDateString('fr-FR')}</Text>
                <Text style={{ marginTop: 20 }}>Signature du bailleur</Text>
            </View>

            <Text style={styles.footer}>
                Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte versé sur le présent terme.
            </Text>
        </Page>
    </Document>
);
