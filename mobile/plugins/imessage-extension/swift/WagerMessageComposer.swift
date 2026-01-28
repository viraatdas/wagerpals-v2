import Messages
import Foundation

struct WagerMessageComposer {
    static func compose(title: String, sideA: String, sideB: String) -> MSMessage {
        let message = MSMessage()
        let layout = MSMessageTemplateLayout()

        layout.caption = "🎲 \(title)"
        layout.subcaption = "\(sideA)  vs  \(sideB)"
        layout.trailingSubcaption = "Tap to wager"

        message.layout = layout

        var components = URLComponents(string: "https://wagerpals.io/invite")!
        components.queryItems = [
            URLQueryItem(name: "title", value: title),
            URLQueryItem(name: "sideA", value: sideA),
            URLQueryItem(name: "sideB", value: sideB),
        ]
        message.url = components.url

        message.summaryText = "Wager invite: \(title)"

        return message
    }
}
