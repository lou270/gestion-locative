
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 16, marginBottom: 15, textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline' },
    section: { marginBottom: 10 },
    subtitle: { fontSize: 12, marginBottom: 5, fontWeight: 'bold', backgroundColor: '#eee', padding: 2 },
    row: { flexDirection: 'row', marginBottom: 2 },
    label: { width: 120, fontWeight: 'bold' },
    value: { flex: 1 },
    clause: { marginBottom: 8, textAlign: 'justify' },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc' },
    signatureBox: { width: '45%' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: 'gray' },
});

interface LeaseProps {
    tenant: any;
    landlord: any;
    property: any;
    date: Date;
}

export const LeaseDocument = ({ tenant, landlord, property, date }: LeaseProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>CONTRAT DE LOCATION (LOGEMENT VIDE)</Text>
            <Text style={{ textAlign: 'center', fontSize: 9, marginBottom: 20, fontStyle: 'italic' }}>
                Soumis au titre Ier de la loi n° 89-462 du 6 juillet 1989
            </Text>

            {/* BAILLEUR */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>1. DÉSIGNATION DES PARTIES</Text>
                <Text style={{ fontWeight: 'bold', marginTop: 5 }}>LE BAILLEUR (Le Propriétaire) :</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nom / Prénom :</Text>
                    <Text style={styles.value}>{landlord ? `${landlord.firstName} ${landlord.lastName}` : "________________________"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Adresse :</Text>
                    <Text style={styles.value}>
                        {landlord ? `${landlord.address || ''} ${landlord.postalCode || ''} ${landlord.city || ''}` : "________________________"}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email / Tél :</Text>
                    <Text style={styles.value}>
                        {landlord ? `${landlord.email || ''} / ${landlord.phone || ''}` : "________________________"}
                    </Text>
                </View>

                <Text style={{ fontWeight: 'bold', marginTop: 10 }}>LE LOCATAIRE :</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nom / Prénom :</Text>
                    <Text style={styles.value}>{tenant.firstName} {tenant.lastName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email / Tél :</Text>
                    <Text style={styles.value}>{tenant.email || ''} / {tenant.phone || ''}</Text>
                </View>
            </View>

            {/* OBJET */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>2. OBJET DU CONTRAT</Text>
                <Text style={styles.clause}>Le présent contrat a pour objet la location d'un logement à usage d'habitation principale.</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Adresse du bien :</Text>
                    <Text style={styles.value}>
                        {property ? `${property.address}, ${property.postalCode} ${property.city}` : `${tenant.address}, ${tenant.postalCode} ${tenant.city}`}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Type de bien :</Text>
                    <Text style={styles.value}>{property ? property.type : "Appartement"}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Désignation :</Text>
                    <Text style={styles.value}>{property ? property.name : ""}</Text>
                </View>
            </View>

            {/* DUREE */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>3. DATE DE PRISE D'EFFET ET DURÉE</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Date de prise d'effet :</Text>
                    <Text style={styles.value}>{new Date(tenant.startDate).toLocaleDateString('fr-FR')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Durée :</Text>
                    <Text style={styles.value}>3 ans (renouvelable par tacite reconduction)</Text>
                </View>
                {tenant.endDate && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Date de fin prévue :</Text>
                        <Text style={styles.value}>{new Date(tenant.endDate).toLocaleDateString('fr-FR')}</Text>
                    </View>
                )}
            </View>

            {/* CONDITIONS FINANCIERES */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>4. CONDITIONS FINANCIÈRES</Text>
                <Text style={{ marginBottom: 5 }}>Les parties conviennent des conditions financières suivantes :</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Loyer mensuel HC :</Text>
                    <Text style={styles.value}>{tenant.rentAmount.toFixed(2)} €</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Provision charges :</Text>
                    <Text style={styles.value}>{tenant.chargeAmount.toFixed(2)} €</Text>
                </View>
                <View style={[styles.row, { marginTop: 5, fontWeight: 'bold' }]}>
                    <Text style={styles.label}>TOTAL MENSUEL :</Text>
                    <Text style={styles.value}>{(tenant.rentAmount + tenant.chargeAmount).toFixed(2)} €</Text>
                </View>

                <Text style={{ marginTop: 10, fontSize: 9 }}>
                    Le paiement s'effectuera mensuellement et d'avance, au plus tard le 5 de chaque mois.
                </Text>
            </View>

            {/* DEPOT DE GARANTIE */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>5. DÉPÔT DE GARANTIE</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Montant :</Text>
                    <Text style={styles.value}>{tenant.rentAmount.toFixed(2)} € (Un mois de loyer hors charges)</Text>
                </View>
            </View>

            {/* CLAUSES */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>6. CLAUSES PARTICULIÈRES</Text>
                <Text style={styles.clause}>
                    - Le locataire s'oblige à user paisiblement des locaux loués.
                </Text>
                <Text style={styles.clause}>
                    - Le locataire doit souscrire une assurance contre les risques locatifs.
                </Text>
                <Text style={styles.clause}>
                    - La sous-location est interdite sans accord écrit du bailleur.
                </Text>
            </View>


            <View style={{ flex: 1 }}></View>

            <View style={styles.section}>
                <Text>Fait à ________________________, le {date.toLocaleDateString('fr-FR')}</Text>
                <Text>En autant d'exemplaires que de parties.</Text>
            </View>

            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 30 }}>Le Bailleur</Text>
                    <Text style={{ fontSize: 9, color: 'gray' }}>(Signature précédée de "Lu et approuvé")</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 30 }}>Le Locataire</Text>
                    <Text style={{ fontSize: 9, color: 'gray' }}>(Signature précédée de "Lu et approuvé")</Text>
                    {/* Anchor for Yousign - Invisible text */}
                    <Text style={{ color: '#ffffff', fontSize: 1 }}>signature_locataire</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Paraphes : Bailleur ______ / Locataire ______
            </Text>
        </Page>
    </Document>
);
