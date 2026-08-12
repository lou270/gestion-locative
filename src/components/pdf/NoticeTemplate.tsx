import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { euros, frDate, landlordName, madeAt } from './format';
import type { PdfLandlord, PdfProperty } from './types';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
    title: { fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    header: { marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
    section: { marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
    footer: { marginTop: 40, textAlign: 'center', fontSize: 10, color: 'gray' },
    box: { borderWidth: 1, borderColor: '#000', padding: 10, marginTop: 10 },
});

interface NoticeProps {
    tenant: {
        firstName: string;
        lastName: string;
        address: string;
        postalCode: string;
        city: string;
        property?: PdfProperty | null;
    };
    landlord?: PdfLandlord | null;
    period: { start: Date; end: Date };
    amount: { rent: number; charge: number; total: number; caf?: number };
    date: Date;
    /** Positif : avance du locataire. Négatif : arriérés. */
    previousBalance: number;
}

export const NoticeDocument = ({
    tenant,
    landlord,
    period,
    amount,
    date,
    previousBalance,
}: NoticeProps) => {
    const cafAmount = amount.caf && amount.caf > 0 ? amount.caf : 0;
    const carried = Math.abs(previousBalance) > 0.01 ? previousBalance : 0;
    const totalDue = amount.total - carried - cafAmount;

    const bailleur = landlordName(landlord) || 'Agence / Propriétaire';
    const logement = tenant.property
        ? `${tenant.property.name} — ${tenant.property.address}, ${tenant.property.postalCode} ${tenant.property.city}`
        : `${tenant.address}, ${tenant.postalCode} ${tenant.city}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>AVIS D&apos;ÉCHÉANCE</Text>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.bold}>BAILLEUR</Text>
                        <Text>{bailleur}</Text>
                        {landlord?.address ? <Text>{landlord.address}</Text> : null}
                        {landlord?.postalCode && landlord?.city ? (
                            <Text>{`${landlord.postalCode} ${landlord.city}`}</Text>
                        ) : null}
                        {landlord?.email ? <Text>{landlord.email}</Text> : null}
                        {landlord?.siret ? (
                            <Text style={{ fontSize: 9, marginTop: 2 }}>{`SIRET : ${landlord.siret}`}</Text>
                        ) : null}
                    </View>
                    <View>
                        <Text style={styles.bold}>DESTINATAIRE</Text>
                        <Text>{`${tenant.firstName} ${tenant.lastName}`}</Text>
                        <Text>{tenant.address}</Text>
                        <Text>{`${tenant.postalCode} ${tenant.city}`}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>
                        <Text style={styles.bold}>Période : </Text>
                        <Text>{`du ${frDate(period.start)} au ${frDate(period.end)}`}</Text>
                    </Text>
                    <Text>
                        <Text style={styles.bold}>Logement : </Text>
                        <Text>{logement}</Text>
                    </Text>
                </View>

                <View style={styles.box}>
                    <View style={styles.row}>
                        <Text>Loyer hors charges</Text>
                        <Text>{euros(amount.rent)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Provision pour charges</Text>
                        <Text>{euros(amount.charge)}</Text>
                    </View>

                    {carried !== 0 ? (
                        <View style={styles.row}>
                            <Text>
                                {carried > 0
                                    ? 'Avance versée (à déduire)'
                                    : 'Arriérés antérieurs (à ajouter)'}
                            </Text>
                            <Text>{`${carried > 0 ? '-' : '+'} ${euros(Math.abs(carried))}`}</Text>
                        </View>
                    ) : null}

                    {cafAmount > 0 ? (
                        <View style={styles.row}>
                            <Text>Allocation logement versée par la CAF</Text>
                            <Text>{`- ${euros(cafAmount)}`}</Text>
                        </View>
                    ) : null}

                    <View
                        style={[
                            styles.row,
                            { marginTop: 10, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 },
                        ]}
                    >
                        <Text style={styles.bold}>TOTAL À PAYER</Text>
                        <Text style={styles.bold}>{euros(totalDue)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={{ marginTop: 20 }}>Somme à régler avant le 5 du mois.</Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <Text>{madeAt(landlord?.city, date)}</Text>
                </View>

                <Text style={styles.footer}>
                    Ce document est un avis d&apos;échéance valant appel de loyer. Il ne vaut pas
                    quittance.
                </Text>
            </Page>
        </Document>
    );
};
