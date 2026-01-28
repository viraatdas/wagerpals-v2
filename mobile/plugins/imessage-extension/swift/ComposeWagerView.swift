import SwiftUI

struct ComposeWagerView: View {
    @State private var eventTitle = ""
    @State private var sideA = ""
    @State private var sideB = ""

    var onSend: (String, String, String) -> Void

    private var isValid: Bool {
        !eventTitle.trimmingCharacters(in: .whitespaces).isEmpty &&
        !sideA.trimmingCharacters(in: .whitespaces).isEmpty &&
        !sideB.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("Create a Wager")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.top, 24)

            VStack(alignment: .leading, spacing: 6) {
                Text("Event Title")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                TextField("e.g. Super Bowl LVIII", text: $eventTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Side A")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                TextField("e.g. Chiefs win", text: $sideA)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Side B")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                TextField("e.g. 49ers win", text: $sideB)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }

            Button(action: {
                onSend(
                    eventTitle.trimmingCharacters(in: .whitespaces),
                    sideA.trimmingCharacters(in: .whitespaces),
                    sideB.trimmingCharacters(in: .whitespaces)
                )
            }) {
                Text("Send Wager Invite")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isValid ? Color(red: 234/255, green: 88/255, blue: 12/255) : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(!isValid)

            Spacer()
        }
        .padding(.horizontal, 24)
    }
}
