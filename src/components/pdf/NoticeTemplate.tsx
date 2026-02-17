
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Réutilisation des styles de base (dupliqués pour l'instant pour indépendance)
const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
    title: { fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    header: { marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
    section: { marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
    footer: { marginTop: 40, textAlign: 'center', fontSize: 10, color: 'gray' },
    box: { borderWidth: 1, borderColor: '#000', padding: 10, marginTop: 10 }
});

interface NoticeProps {
    tenant: any;
    landlord?: any; // Nouveau prop
    period: { start: Date; end: Date };
    amount: { rent: number; charge: number; total: number; caf?: number };
    date: Date;
    previousBalance: number;
}

export const NoticeDocument = ({ tenant, landlord, period, amount, date, previousBalance }: NoticeProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>AVIS D'ÉCHÉANCE</Text>

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
                    <Text style={styles.bold}>DESTINATAIRE</Text>
                    <Text>{tenant.firstName} {tenant.lastName}</Text>
                    <Text>{tenant.address}</Text>
                    <Text>{tenant.postalCode} {tenant.city}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text>
                    <Text style={styles.bold}>Concerne : </Text>
                    <Text style={styles.bold}>Période : </Text>
                    du {period.start.toLocaleDateString('fr-FR')} au {period.end.toLocaleDateString('fr-FR')}
                </Text>
                <Text>
                    <Text style={styles.bold}>Logement : </Text>
                    {tenant.property ? (
                        <Text>{tenant.property.name} - {tenant.property.address}, {tenant.property.postalCode} {tenant.property.city}</Text>
                    ) : (
                        <Text>{tenant.address}, {tenant.postalCode} {tenant.city}</Text>
                    )}
                </Text>
            </View>

            <View style={styles.box}>
                <View style={styles.row}>
                    <Text>Loyer principal</Text>
                    <Text>{amount.rent.toFixed(2)} €</Text>
                </View>
                <View style={styles.row}>
                    <Text>Provision pour charges</Text>
                    <Text>{amount.charge.toFixed(2)} €</Text>
                </View>

                {/* Ligne Solde Précédent si non nul */}
                {(previousBalance && Math.abs(previousBalance) > 0.01) ? (
                    <View style={styles.row}>
                        <Text>{previousBalance > 0 ? "Crédit antérieur (à déduire)" : "Arriérés antérieurs (à ajouter)"}</Text>
                        <Text>{previousBalance > 0 ? "- " : "+ "}{Math.abs(previousBalance).toFixed(2)} €</Text>
                    </View>
                ) : null}

                {/* Ajout ligne CAF */}
                {(amount.caf && amount.caf > 0) ? (
                    <View style={styles.row}>
                        <Text>Allocation Logement (CAF)</Text>
                        <Text>- {amount.caf.toFixed(2)} €</Text>
                    </View>
                ) : null}

                <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
                    <Text style={styles.bold}>TOTAL À PAYER</Text>
                    <Text style={styles.bold}>{(amount.total - (previousBalance || 0) - (amount.caf || 0)).toFixed(2)} €</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={{ marginTop: 20 }}>
                    Somme à régler avant le 5 du mois.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={{ marginTop: 20 }}>
                    Fait à Paris, le {date.toLocaleDateString('fr-FR')}
                </Text>
            </View>

            <Text style={styles.footer}>
                Ce document est un avis d'échéance valant appel de loyer. Il ne vaut pas quittance.
            </Text>
        </Page>
    </Document>
);
