import { useEffect, useState } from "react";
import { useDiscordSdk } from "../hooks/useDiscordSdk.js";
export const Activity = ()=>{
    const { authenticated, discordSdk, status } = useDiscordSdk();
    const [channelName, setChannelName] = useState();
    useEffect(()=>{
        // Requesting the channel in GDMs (when the guild ID is null) requires
        // the dm_channels.read scope which requires Discord approval.
        if (!authenticated || !discordSdk.channelId || !discordSdk.guildId) {
            return;
        }
        // Collect channel info over RPC
        // Enable authentication to see it! (App.tsx)
        discordSdk.commands.getChannel({
            channel_id: discordSdk.channelId
        }).then((channel)=>{
            if (channel.name) {
                setChannelName(channel.name);
            }
        });
    }, [
        authenticated,
        discordSdk
    ]);
    return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("img", {
        src: "/rocket.png",
        className: "logo",
        alt: "Discord"
    }), /*#__PURE__*/ React.createElement("h1", null, "Hello, World"), channelName ? /*#__PURE__*/ React.createElement("h3", null, "#", channelName) : /*#__PURE__*/ React.createElement("h3", null, status), /*#__PURE__*/ React.createElement("small", null, "Powered by ", /*#__PURE__*/ React.createElement("strong", null, "Robo.js")));
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcZmlzaDU4NThcXERvY3VtZW50c1xcRGlzY29yZF9yb2JvXFxzcmNcXGFwcFxcQWN0aXZpdHkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZURpc2NvcmRTZGsgfSBmcm9tICcuLi9ob29rcy91c2VEaXNjb3JkU2RrJ1xuXG5leHBvcnQgY29uc3QgQWN0aXZpdHkgPSAoKSA9PiB7XG5cdGNvbnN0IHsgYXV0aGVudGljYXRlZCwgZGlzY29yZFNkaywgc3RhdHVzIH0gPSB1c2VEaXNjb3JkU2RrKClcblx0Y29uc3QgW2NoYW5uZWxOYW1lLCBzZXRDaGFubmVsTmFtZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KClcblxuXHR1c2VFZmZlY3QoKCkgPT4ge1xuXHRcdC8vIFJlcXVlc3RpbmcgdGhlIGNoYW5uZWwgaW4gR0RNcyAod2hlbiB0aGUgZ3VpbGQgSUQgaXMgbnVsbCkgcmVxdWlyZXNcblx0XHQvLyB0aGUgZG1fY2hhbm5lbHMucmVhZCBzY29wZSB3aGljaCByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsLlxuXHRcdGlmICghYXV0aGVudGljYXRlZCB8fCAhZGlzY29yZFNkay5jaGFubmVsSWQgfHwgIWRpc2NvcmRTZGsuZ3VpbGRJZCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Ly8gQ29sbGVjdCBjaGFubmVsIGluZm8gb3ZlciBSUENcblx0XHQvLyBFbmFibGUgYXV0aGVudGljYXRpb24gdG8gc2VlIGl0ISAoQXBwLnRzeClcblx0XHRkaXNjb3JkU2RrLmNvbW1hbmRzLmdldENoYW5uZWwoeyBjaGFubmVsX2lkOiBkaXNjb3JkU2RrLmNoYW5uZWxJZCB9KS50aGVuKChjaGFubmVsKSA9PiB7XG5cdFx0XHRpZiAoY2hhbm5lbC5uYW1lKSB7XG5cdFx0XHRcdHNldENoYW5uZWxOYW1lKGNoYW5uZWwubmFtZSlcblx0XHRcdH1cblx0XHR9KVxuXHR9LCBbYXV0aGVudGljYXRlZCwgZGlzY29yZFNka10pXG5cblx0cmV0dXJuIChcblx0XHQ8ZGl2PlxuXHRcdFx0PGltZyBzcmM9XCIvcm9ja2V0LnBuZ1wiIGNsYXNzTmFtZT1cImxvZ29cIiBhbHQ9XCJEaXNjb3JkXCIgLz5cblx0XHRcdDxoMT5IZWxsbywgV29ybGQ8L2gxPlxuXHRcdFx0e2NoYW5uZWxOYW1lID8gPGgzPiN7Y2hhbm5lbE5hbWV9PC9oMz4gOiA8aDM+e3N0YXR1c308L2gzPn1cblx0XHRcdDxzbWFsbD5cblx0XHRcdFx0UG93ZXJlZCBieSA8c3Ryb25nPlJvYm8uanM8L3N0cm9uZz5cblx0XHRcdDwvc21hbGw+XG5cdFx0PC9kaXY+XG5cdClcbn1cbiJdLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsInVzZURpc2NvcmRTZGsiLCJBY3Rpdml0eSIsImF1dGhlbnRpY2F0ZWQiLCJkaXNjb3JkU2RrIiwic3RhdHVzIiwiY2hhbm5lbE5hbWUiLCJzZXRDaGFubmVsTmFtZSIsImNoYW5uZWxJZCIsImd1aWxkSWQiLCJjb21tYW5kcyIsImdldENoYW5uZWwiLCJjaGFubmVsX2lkIiwidGhlbiIsImNoYW5uZWwiLCJuYW1lIiwiZGl2IiwiaW1nIiwic3JjIiwiY2xhc3NOYW1lIiwiYWx0IiwiaDEiLCJoMyIsInNtYWxsIiwic3Ryb25nIl0sInJhbmdlTWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxTQUFTLEVBQUVDLFFBQVEsUUFBUSxRQUFPO0FBQzNDLFNBQVNDLGFBQWEsUUFBUSw0QkFBd0I7QUFFdEQsT0FBTyxNQUFNQyxXQUFXO0lBQ3ZCLE1BQU0sRUFBRUMsYUFBYSxFQUFFQyxVQUFVLEVBQUVDLE1BQU0sRUFBRSxHQUFHSjtJQUM5QyxNQUFNLENBQUNLLGFBQWFDLGVBQWUsR0FBR1A7SUFFdENELFVBQVU7UUFDVCxzRUFBc0U7UUFDdEUsOERBQThEO1FBQzlELElBQUksQ0FBQ0ksaUJBQWlCLENBQUNDLFdBQVdJLFNBQVMsSUFBSSxDQUFDSixXQUFXSyxPQUFPLEVBQUU7WUFDbkU7UUFDRDtRQUVBLGdDQUFnQztRQUNoQyw2Q0FBNkM7UUFDN0NMLFdBQVdNLFFBQVEsQ0FBQ0MsVUFBVSxDQUFDO1lBQUVDLFlBQVlSLFdBQVdJLFNBQVM7UUFBQyxHQUFHSyxJQUFJLENBQUMsQ0FBQ0M7WUFDMUUsSUFBSUEsUUFBUUMsSUFBSSxFQUFFO2dCQUNqQlIsZUFBZU8sUUFBUUMsSUFBSTtZQUM1QjtRQUNEO0lBQ0QsR0FBRztRQUFDWjtRQUFlQztLQUFXO0lBRTlCLHFCQUNDLG9CQUFDWSwyQkFDQSxvQkFBQ0M7UUFBSUMsS0FBSTtRQUFjQyxXQUFVO1FBQU9DLEtBQUk7c0JBQzVDLG9CQUFDQyxZQUFHLGlCQUNIZiw0QkFBYyxvQkFBQ2dCLFlBQUcsS0FBRWhCLDZCQUFvQixvQkFBQ2dCLFlBQUlqQix1QkFDOUMsb0JBQUNrQixlQUFNLDZCQUNLLG9CQUFDQyxnQkFBTztBQUl2QixFQUFDIn0=